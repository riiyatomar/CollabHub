import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { Link as LinkIcon } from 'lucide-react';

interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string;
}

interface LinkPreviewProps {
  url: string;
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      try {
        const response = await axiosInstance.post('/messages/link-preview', { url });
        if (isMounted && response.data?.data) {
          setData(response.data.data);
        }
      } catch {
        // silently fail for link previews
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPreview();
    return () => { isMounted = false; };
  }, [url]);

  if (isLoading) return null;
  if (!data || (!data.title && !data.description && !data.image)) return null;

  return (
    <a 
      href={data.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="flex flex-col mt-2 max-w-lg bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:bg-gray-100 transition-colors group"
    >
      {data.image && (
        <div className="h-40 w-full overflow-hidden bg-gray-200">
          <img src={data.image} alt={data.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center text-xs text-gray-500 mb-1">
          <LinkIcon className="w-3 h-3 mr-1" />
          <span className="truncate">{new URL(data.url).hostname}</span>
        </div>
        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {data.title || data.url}
        </h4>
        {data.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
}
