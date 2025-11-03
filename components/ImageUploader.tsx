
import React, { useRef } from 'react';
import { UploadedImage } from '../types';
import { UploadIcon } from './IconComponents';

interface ImageUploaderProps {
  id: string;
  title: string;
  image: UploadedImage | null;
  onImageUpload: (image: UploadedImage | null) => void;
  onImageRemove: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, title, image, onImageUpload, onImageRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload({
          file: file,
          base64: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onImageRemove();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };
  
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{title}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="group relative w-full aspect-square bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col justify-center items-center cursor-pointer hover:border-indigo-500 transition-colors duration-300"
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {image ? (
          <>
            <img src={image.base64} alt="Upload preview" className="object-contain w-full h-full rounded-md" />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
               <button onClick={handleRemove} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Xóa</button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
            <p className="mt-2 text-sm text-gray-400">Nhấn để tải lên</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
