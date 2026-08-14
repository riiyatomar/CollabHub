import { useEffect, useState, useMemo } from 'react';
import { useFileStore, type UploadedFile } from '../../store/useFileStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useDropzone } from 'react-dropzone';
import {
  FileIcon, ImageIcon, VideoIcon, MusicIcon, FileTextIcon, 
  Search, LayoutGrid, List as ListIcon,
  Download, Trash2, Edit2, UploadCloud
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';

export default function WorkspaceFiles({ workspaceId }: { workspaceId: string }) {
  const { workspaceFiles, fetchWorkspaceFiles, isLoading, addFilesToQueue, startUploads, uploadQueue, deleteFile, renameFile } = useFileStore();
  const { user } = useAuthStore();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceFiles(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceFiles]);

  const onDrop = (acceptedFiles: File[]) => {
    addFilesToQueue(acceptedFiles);
    startUploads(workspaceId, undefined, () => {
      toast.success('Files uploaded successfully');
      fetchWorkspaceFiles(workspaceId);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="text-blue-500" />;
    if (mimeType.startsWith('video/')) return <VideoIcon className="text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <MusicIcon className="text-yellow-500" />;
    if (mimeType === 'application/pdf' || mimeType.includes('document')) return <FileTextIcon className="text-red-500" />;
    return <FileIcon className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = useMemo(() => {
    let files = workspaceFiles;

    if (searchQuery) {
      files = files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (filterType !== 'all') {
      files = files.filter(f => f.mimeType.startsWith(filterType));
    }

    if (showOnlyMine) {
      files = files.filter(f => f.uploadedBy.id === user?.id);
    }

    return files;
  }, [workspaceFiles, searchQuery, filterType, showOnlyMine, user]);

  const handleDelete = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(fileId);
        toast.success('File deleted');
      } catch {
        toast.error('Failed to delete file');
      }
    }
  };

  const startRename = (e: React.MouseEvent, file: UploadedFile) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setEditName(file.filename);
  };

  const handleRename = async (e: React.FormEvent, fileId: string) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      await renameFile(fileId, editName);
      setEditingFileId(null);
      toast.success('File renamed');
    } catch {
      toast.error('Failed to rename file');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b border-gray-100 gap-4">
        <div className="flex items-center w-full sm:w-auto relative">
          <Search className="w-5 h-5 absolute left-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search files..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="image/">Images</option>
            <option value="video/">Videos</option>
            <option value="application/pdf">PDFs</option>
            <option value="audio/">Audio</option>
          </select>

          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showOnlyMine}
              onChange={(e) => setShowOnlyMine(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <span>My Files</span>
          </label>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-md", viewMode === 'grid' ? "bg-white shadow-sm text-primary" : "text-gray-500")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md", viewMode === 'list' ? "bg-white shadow-sm text-primary" : "text-gray-500")}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadQueue.length > 0 && (
        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex flex-col gap-2">
          {uploadQueue.map(task => (
            <div key={task.id} className="flex items-center justify-between text-sm">
              <span className="truncate w-1/2 text-gray-700">{task.file.name}</span>
              <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-300", task.status === 'ERROR' ? 'bg-red-500' : 'bg-primary')} 
                  style={{ width: `${task.progress}%` }} 
                />
              </div>
              <span className="text-gray-500 w-16 text-right">
                {task.status === 'ERROR' ? 'Error' : `${task.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* File Area */}
      <div 
        {...getRootProps()} 
        className={cn(
          "flex-1 overflow-y-auto p-6 transition-colors",
          isDragActive ? "bg-indigo-50/50" : ""
        )}
      >
        <input {...getInputProps()} />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No files found</h3>
            <p className="text-gray-500 max-w-sm mb-6">Drag and drop files here to upload, or use the composer to share files in channels.</p>
            <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors">
              Select Files
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "flex flex-col space-y-2"}>
            {filteredFiles.map((file) => (
              <div 
                key={file.id} 
                className={cn(
                  "group relative border border-gray-200 bg-white hover:border-primary/50 hover:shadow-md transition-all cursor-pointer",
                  viewMode === 'grid' ? "rounded-xl flex flex-col overflow-hidden" : "rounded-lg flex items-center p-3"
                )}
                onClick={() => window.open(file.secureUrl, '_blank')}
              >
                {/* Thumbnail Area for Grid */}
                {viewMode === 'grid' && (
                  <div className="h-40 bg-gray-50 border-b border-gray-100 flex items-center justify-center overflow-hidden">
                    {file.thumbnailUrl ? (
                      <img src={file.thumbnailUrl} alt={file.filename} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="scale-[2]">
                        {getFileIcon(file.mimeType)}
                      </div>
                    )}
                  </div>
                )}

                {/* Info Area */}
                <div className={cn("p-4 flex-1 flex flex-col justify-between", viewMode === 'list' && "flex-row items-center p-0 ml-3")}>
                  {viewMode === 'list' && (
                    <div className="mr-4 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg shrink-0">
                      {file.thumbnailUrl ? (
                        <img src={file.thumbnailUrl} alt={file.filename} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        getFileIcon(file.mimeType)
                      )}
                    </div>
                  )}

                  <div className={cn("flex-1", viewMode === 'list' && "grid grid-cols-12 gap-4 items-center")}>
                    {editingFileId === file.id ? (
                      <form onSubmit={(e) => handleRename(e, file.id)} onClick={(e) => e.stopPropagation()} className={cn("flex", viewMode === 'list' && "col-span-5")}>
                        <input 
                          type="text" 
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border-b border-primary px-1 py-0.5 text-sm focus:outline-none"
                        />
                        <button type="submit" className="hidden"></button>
                      </form>
                    ) : (
                      <h4 className={cn("text-sm font-medium text-gray-900 truncate", viewMode === 'list' && "col-span-5")} title={file.filename}>
                        {file.filename}
                      </h4>
                    )}

                    {viewMode === 'list' && (
                      <>
                        <div className="col-span-3 text-xs text-gray-500">{format(new Date(file.createdAt), 'MMM d, yyyy')}</div>
                        <div className="col-span-2 text-xs text-gray-500">{formatFileSize(file.size)}</div>
                        <div className="col-span-2 flex items-center">
                          {file.uploadedBy.avatar ? (
                            <img src={file.uploadedBy.avatar} className="w-5 h-5 rounded-full mr-2" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] mr-2">
                              {file.uploadedBy.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs text-gray-500 truncate">{file.uploadedBy.name}</span>
                        </div>
                      </>
                    )}

                    {viewMode === 'grid' && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {formatFileSize(file.size)} • {file.extension.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions overlay / inline */}
                <div className={cn(
                  "flex items-center gap-1",
                  viewMode === 'grid' ? "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm" : "ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
                )}>
                  <a 
                    href={file.secureUrl} 
                    download
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()} 
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  {(file.uploadedBy.id === user?.id || user?.role === 'ADMIN') && (
                    <>
                      <button 
                        onClick={(e) => startRename(e, file)} 
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, file.id)} 
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-4 border-primary border-dashed rounded-xl m-6 flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
          <div className="bg-white px-8 py-4 rounded-xl shadow-lg flex items-center flex-col">
            <UploadCloud className="w-12 h-12 text-primary mb-2 animate-bounce" />
            <span className="text-lg font-bold text-gray-900">Drop files here to upload</span>
          </div>
        </div>
      )}
    </div>
  );
}
