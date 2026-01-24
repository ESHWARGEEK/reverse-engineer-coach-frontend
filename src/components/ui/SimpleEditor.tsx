import React from 'react';

interface SimpleEditorProps {
  height?: string | number;
  language?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  onMount?: (editor: any, monaco: any) => void;
  options?: any;
  theme?: string;
}

export const SimpleEditor: React.FC<SimpleEditorProps> = ({
  height = "100%",
  language = "javascript",
  value = "",
  onChange,
  onMount,
  options = {},
  theme = "vs-dark"
}) => {
  // Fallback simple textarea if Monaco Editor fails
  return (
    <textarea
      className="w-full h-full bg-gray-900 text-white font-mono text-sm p-4 border border-gray-700 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={{ height: typeof height === 'string' ? height : `${height}px` }}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={`// ${language} code here...`}
      spellCheck={false}
    />
  );
};