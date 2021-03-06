import React, { useState, useRef, ChangeEvent, forwardRef, HTMLAttributes } from "react";

import axios from "axios";
import Button from "../Button/button";
import UploadList from "./uploadList";
import Dragger from "./dragger";

export type UploadFileStatus = "ready" | "uploading" | "success" | "error";

export interface UploadFile {
  uid: string;
  size: number;
  name: string;
  status?: UploadFileStatus;
  percentage?: number;
  raw?: File;
  response?: any;
  error?: any;
}

export interface UploadProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange' | 'onError' | 'onProgress'> {
  /** 必选参数，上传的地址 */
  action: string;
  /** 接受上传的文件类型 */
  accept?: string;
  /** 是否支持多选文件 */
  multiple?: boolean;
  /** 设置上传的请求头部 */
  headers?: { [key: string]: any };
  /** 上传的文件字段名 */
  name?: string;
  /** 上传时附带的额外参数 */
  data?: { [key: string]: any };
  /** 支持发送 cookie 凭证信息 */
  withCredentials?: boolean;
  /** 是否启用拖拽上传 */
  drag?: boolean;
  /** 默认文件列表 */
  defaultFileList?: UploadFile[];
  /** 上传文件之前的钩子，参数为上传的文件，若返回 false 或者返回 Promise 且被 reject，则停止上传。 */
  beforeUpload?: (file: File) => boolean | Promise<File>;
  /** 上传文件进度改变的钩子 */
  onProgress?: (percentage: number, file: File) => void;
  /** 文件上传成功时的钩子 */
  onSuccess?: (data: any, file: File) => void;
  /** 文件上传失败时的钩子 */
  onError?: (err: any, file: File) => void;
  /** 文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用 */
  onChange?: (file: File) => void;
  /** 文件列表移除文件时的钩子 */
  onRemove?: (file: UploadFile) => void;
}

export const Upload = forwardRef<HTMLDivElement, UploadProps>((props, ref) => {
  const {
    action,
    name,
    headers,
    data,
    accept,
    multiple,
    drag,
    withCredentials,
    defaultFileList,
    beforeUpload,
    onProgress,
    onSuccess,
    onError,
    onChange,
    onRemove,
    children,
    ...restProps
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileList, setFileList] = useState<UploadFile[]>(
    defaultFileList ? defaultFileList : []
  );

  const updateFileList = (
    uploadFile: UploadFile,
    updateObj: Partial<UploadFile>
  ) => {
    setFileList((prevList) => {
      return prevList.map((file) => {
        if (file.uid === uploadFile.uid) {
          return {
            ...file,
            ...updateObj,
          };
        } else {
          return { ...file };
        }
      });
    });
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 上传文件发生改变时的回调
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    uploadFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 删除某个文件的回调
  const handleRemove = (file: UploadFile) => {
    setFileList((prevList) => {
      return prevList.filter((item) => item.uid !== file.uid);
    });
    if (onRemove) {
      onRemove(file);
    }
  };

  // 上传文件: 判断beforeUpload生命周期是否存在。存在就执行。
  const uploadFiles = (files: FileList) => {
    let postFiles = Array.from(files);
    postFiles.forEach((file) => {
      if (!beforeUpload) {
        post(file);
      } else {
        const result = beforeUpload(file);
        if (result && result instanceof Promise) {
          result.then((processedFile) => {
            post(processedFile);
          });
        } else if (result !== false) {
          post(file);
        }
      }
    });
  };

  // 与上传服务交互
  const post = (file: File) => {
    let _file: UploadFile = {
      uid: Date.now() + "upload-file",
      status: "ready",
      name: file.name,
      size: file.size,
      percentage: 0,
      raw: file,
    };
    // setFileList([_file, ...fileList]);
    setFileList((prevList) => {
      return [_file, ...prevList];
    });
    const formData = new FormData();
    formData.append(name || "file", file);
    if (data) {
      Object.keys(data).forEach((key) => formData.append(key, data[key]));
    }
    axios
      .post(action, formData, {
        headers: {
          ...headers,
          "Content-type": "multipart/form-data",
        },
        withCredentials,
        onUploadProgress(e) {
          let percentage = Math.round((e.loaded * 100) / e.total) || 0;
          if (percentage < 100) {
            updateFileList(_file, { percentage, status: "uploading" });
            if (onProgress) {
              onProgress(percentage, file);
            }
          }
        },
      })
      .then((res) => {
        updateFileList(_file, { status: "success", response: res.data });
        if (onSuccess) {
          onSuccess(res.data, file);
        }
        if (onChange) {
          onChange(file);
        }
      })
      .catch((err) => {
        updateFileList(_file, { status: "error", error: err });
        if (onError) {
          onError(err, file);
        }
        if (onChange) {
          onChange(file);
        }
      });
  };

  return (
    <div className="viking-upload-component" ref={ref} {...restProps}>
      <>
        {drag ? (
          <div
            className="viking-upload-input"
            style={{ display: "inline-block" }}
            onClick={handleClick}
          >
            {drag ? (
              <Dragger
                onFile={(files) => {
                  uploadFiles(files);
                }}
              >
                {children}
              </Dragger>
            ) : (
                children
              )}
            <UploadList fileList={fileList} onRemove={handleRemove} />
            <input
              type="file"
              ref={fileInputRef}
              accept={accept}
              multiple={multiple}
              onChange={handleFileChange}
              className="viking-file-input"
              style={{ display: "none" }}
            />
          </div>
        ) : (
            <>
              <Button btnType="primary" onClick={handleClick}>
                Upload File
            </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
                className="viking-file-input"
                style={{ display: "none" }}
              />
              <UploadList fileList={fileList} onRemove={handleRemove} />
            </>
          )}
      </>
    </div>
  );
});

Upload.defaultProps = {
  name: "file",
};

export default Upload;
