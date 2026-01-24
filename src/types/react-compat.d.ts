// React compatibility types to fix version conflicts
declare module 'react' {
  interface ReactNode {
    bigint?: never;
  }
}

// Fix for React Router compatibility
declare module 'react-router-dom' {
  import { ComponentType, AnchorHTMLAttributes } from 'react';
  
  interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
    replace?: boolean;
    state?: any;
    reloadDocument?: boolean;
  }
  
  export const Link: ComponentType<LinkProps>;
  export const useNavigate: () => (to: string, options?: any) => void;
  export const useParams: <T = any>() => T;
  export const BrowserRouter: ComponentType<{ children: React.ReactNode }>;
  export const Routes: ComponentType<{ children: React.ReactNode }>;
  export const Route: ComponentType<{ path: string; element: React.ReactNode }>;
}

// Fix for Lucide React compatibility
declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export const X: ComponentType<SVGProps<SVGSVGElement>>;
  export const AlertCircle: ComponentType<SVGProps<SVGSVGElement>>;
  export const CheckCircle: ComponentType<SVGProps<SVGSVGElement>>;
  export const Info: ComponentType<SVGProps<SVGSVGElement>>;
  export const AlertTriangle: ComponentType<SVGProps<SVGSVGElement>>;
  export const Home: ComponentType<SVGProps<SVGSVGElement>>;
  export const RotateCcw: ComponentType<SVGProps<SVGSVGElement>>;
  export const WifiOff: ComponentType<SVGProps<SVGSVGElement>>;
  export const Wifi: ComponentType<SVGProps<SVGSVGElement>>;
}

// Fix for Monaco Editor React compatibility
declare module '@monaco-editor/react' {
  import { ComponentType } from 'react';
  
  interface EditorProps {
    height?: string | number;
    width?: string | number;
    language?: string;
    value?: string;
    defaultValue?: string;
    theme?: string;
    options?: any;
    onChange?: (value: string | undefined, event: any) => void;
    onMount?: (editor: any, monaco: any) => void;
    beforeMount?: (monaco: any) => void;
    onValidate?: (markers: any[]) => void;
    className?: string;
    wrapperProps?: any;
    loading?: string | React.ReactNode;
    keepCurrentModel?: boolean;
    saveViewState?: boolean;
    overrideServices?: any;
    defaultLanguage?: string;
    defaultPath?: string;
    path?: string;
    line?: number;
  }
  
  const Editor: ComponentType<EditorProps>;
  export default Editor;
}

// Fix for Heroicons React compatibility
declare module '@heroicons/react/outline' {
  import { ComponentType, SVGProps } from 'react';
  
  export const XIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const MenuIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ChatIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const PlusIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const TrashIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const PlayIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const PauseIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const DocumentTextIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const DocumentIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const FolderIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const CodeIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const CheckCircleIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ExclamationIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const InformationCircleIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ArrowPathIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const LinkIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const EyeIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ChevronDownIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ChevronRightIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ClockIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const SearchIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const PaperAirplaneIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const UserIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ChipIcon: ComponentType<SVGProps<SVGSVGElement>>;
}

declare module '@heroicons/react/24/outline' {
  import { ComponentType, SVGProps } from 'react';
  
  export const XMarkIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ChatBubbleLeftRightIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const PlusIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const TrashIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const PlayIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const PauseIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const DocumentTextIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const FolderIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const CodeBracketIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const CheckCircleIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ExclamationTriangleIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const InformationCircleIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ArrowPathIcon: ComponentType<SVGProps<SVGSVGElement>>;
}

declare module '@heroicons/react/24/solid' {
  import { ComponentType, SVGProps } from 'react';
  
  export const XMarkIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ChatBubbleLeftRightIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const PlusIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const TrashIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const PlayIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const PauseIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const DocumentTextIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const FolderIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const CodeBracketIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const CheckCircleIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ExclamationTriangleIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const InformationCircleIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ArrowPathIcon: ComponentType<SVGProps<SVGSVGElement>>;
}

export {};