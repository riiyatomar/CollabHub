import { useState, useEffect } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { useFileStore } from '../../store/useFileStore';
import { useParams } from 'react-router-dom';
import { Button } from '../Button';
import type { TLStore, TLAssetId } from 'tldraw';
import { AssetRecordType, createShapeId } from 'tldraw';

interface Props {
  store: TLStore;
}

export default function InsertWorkspaceImageButton({ store }: Props) {
  const { workspaceId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const { workspaceFiles, fetchWorkspaceFiles, isLoading } = useFileStore();

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchWorkspaceFiles(workspaceId);
    }
  }, [isOpen, workspaceId, fetchWorkspaceFiles]);

  const images = workspaceFiles.filter(f => f.mimeType?.startsWith('image/'));

  const handleInsert = (url: string) => {
    // Basic image insertion for tldraw
    const assetId: TLAssetId = AssetRecordType.createId();
    
    store.put([{
      id: assetId,
      type: 'asset',
      typeName: 'asset',
      props: {
        type: 'image',
        src: url,
        w: 400,
        h: 400,
        name: 'Inserted Image',
        isAnimated: false,
        mimeType: 'image/jpeg',
      },
    }] as any[]);
    
    store.put([{
      id: createShapeId(),
      type: 'image',
      x: window.innerWidth / 2 - 200, 
      y: window.innerHeight / 2 - 200,
      props: {
        assetId,
        w: 400,
        h: 400,
      },
    }] as any[]);

    setIsOpen(false);
  };

  return (
    <>
      <div className="absolute top-16 left-4 z-50">
        <Button 
          variant="outline" 
          className="bg-white shadow-sm flex items-center gap-2"
          onClick={() => setIsOpen(true)}
        >
          <ImageIcon className="w-4 h-4" />
          Insert Image
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Insert Workspace Image</h2>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : images.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No images found in this workspace. Upload some files first!
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {images.map(img => (
                    <button
                      key={img.id}
                      onClick={() => handleInsert(img.secureUrl)}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <img 
                        src={img.secureUrl} 
                        alt={img.originalName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white text-sm font-medium">Insert</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
