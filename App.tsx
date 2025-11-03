
import React, { useState, useCallback } from 'react';
import { UploadedImage } from './types';
import { suggestPrompt, describeImage, suggestPromptFromImage, editImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import { SparklesIcon, MagicWandIcon, DocumentTextIcon, LoadingSpinner } from './components/IconComponents';

const App: React.FC = () => {
  const [primaryImage, setPrimaryImage] = useState<UploadedImage | null>(null);
  const [referenceImage, setReferenceImage] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [detailedDescription, setDetailedDescription] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = useCallback(async <T,>(action: () => Promise<T>, actionName: string, onSuccess: (result: T) => void) => {
    setIsLoading(true);
    setLoadingAction(actionName);
    setError(null);
    try {
      const result = await action();
      onSuccess(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi không mong muốn.');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  }, []);

  const handleSuggestPrompt = () => handleAction(suggestPrompt, 'suggest', (newPrompt) => setPrompt(newPrompt));
  
  const handleDescribeImage = () => {
    if (!referenceImage) return;
    handleAction(() => describeImage(referenceImage), 'describe', (description) => setDetailedDescription(description));
  };

  const handleSuggestFromImage = () => {
    if (!referenceImage) return;
    handleAction(() => suggestPromptFromImage(referenceImage), 'suggestFromImage', (newPrompt) => setPrompt(newPrompt));
  }

  const handleGenerateImage = () => {
    if (!primaryImage || !prompt) return;
    setGeneratedImage(null);
    handleAction(
      () => editImage({ primaryImage, prompt, detailedDescription, referenceImage }),
      'generate',
      (newImage) => setGeneratedImage(newImage)
    );
  };

  const isGenerateDisabled = !primaryImage || !prompt || isLoading;

  const ActionButton: React.FC<{onClick: () => void, disabled?: boolean, actionName: string, children: React.ReactNode}> = ({onClick, disabled, actionName, children}) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
    >
      {isLoading && loadingAction === actionName ? <LoadingSpinner /> : children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Trình chỉnh sửa ảnh Gemini AI
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Hiện thực hóa ý tưởng sáng tạo. Chỉnh sửa ảnh với sức mạnh của AI.
          </p>
        </header>

        {error && (
            <div className="bg-red-900 border border-red-400 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Lỗi: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-1 space-y-8 p-6 bg-gray-800 rounded-xl shadow-2xl">
              <ImageUploader 
                  id="primary-image" 
                  title="1. Tải ảnh của bạn lên" 
                  image={primaryImage} 
                  onImageUpload={setPrimaryImage} 
                  onImageRemove={() => setPrimaryImage(null)}
              />

              <div className="space-y-2">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">2. Mô tả chỉnh sửa</label>
                <textarea
                  id="prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="ví dụ: Thêm bộ lọc cổ điển, xóa người trong nền..."
                  className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                />
                 <ActionButton onClick={handleSuggestPrompt} actionName="suggest" disabled={isLoading}>
                    <SparklesIcon className="w-5 h-5 mr-2" /> Gợi ý của AI
                </ActionButton>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-gray-200">Tùy chọn nâng cao</h3>
                <div className="space-y-2">
                  <label htmlFor="detailed-desc" className="block text-sm font-medium text-gray-300">Hướng dẫn chi tiết (Tùy chọn)</label>
                  <textarea
                    id="detailed-desc"
                    rows={4}
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    placeholder="Cung cấp thêm ngữ cảnh hoặc chi tiết cụ thể cho AI..."
                    className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <ImageUploader 
                  id="reference-image"
                  title="Ảnh tham khảo (Tùy chọn)"
                  image={referenceImage}
                  onImageUpload={setReferenceImage}
                  onImageRemove={() => setReferenceImage(null)}
                />
                <div className="grid grid-cols-2 gap-2">
                    <ActionButton onClick={handleDescribeImage} actionName="describe" disabled={!referenceImage || isLoading}>
                        <DocumentTextIcon className="w-5 h-5 mr-2" /> Lấy mô tả
                    </ActionButton>
                    <ActionButton onClick={handleSuggestFromImage} actionName="suggestFromImage" disabled={!referenceImage || isLoading}>
                        <SparklesIcon className="w-5 h-5 mr-2" /> Gợi ý
                    </ActionButton>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isGenerateDisabled}
                  className="w-full flex items-center justify-center text-lg font-bold py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ring-offset-gray-800 transition-all transform hover:scale-105"
                >
                  {isLoading && loadingAction === 'generate' ? <LoadingSpinner /> : <MagicWandIcon className="w-6 h-6 mr-3" />}
                  Tạo ảnh
                </button>
              </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2">
            <div className="p-4 bg-gray-800 rounded-xl shadow-2xl h-full flex flex-col">
              <h2 className="text-xl font-bold mb-4 text-center text-gray-300">Kết quả</h2>
              <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center flex-grow">
                {isLoading && loadingAction === 'generate' ? (
                   <div className="flex flex-col items-center">
                      <LoadingSpinner />
                      <p className="mt-2 text-gray-400">Đang tạo ảnh của bạn...</p>
                   </div>
                ) : generatedImage ? (
                  <img src={generatedImage} alt="Generated" className="object-contain w-full h-full rounded-md" />
                ) : (
                  <p className="text-gray-500">Ảnh mới của bạn sẽ xuất hiện ở đây</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
