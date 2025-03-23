import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SortableFeedItemProps } from '@/lib/types';
import { Trash2, ArrowUp, ArrowDown, FolderSync , X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';



const SortableFeedItem: React.FC<SortableFeedItemProps> = ({
    feed,
    onRemove,
    onSelect,
    unreadCount,
    parentId,
    onMoveUp,
    onMoveDown,
    onMoveToFolder,
    folders,
  }) => {

    const [isMoving, setIsMoving] = useState(false);
    const currentFolder = folders.find(f => f.id === parentId);

    return (
        <div
            className={cn(
                "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 mb-1",
                "border border-transparent hover:border-gray-200 dark:hover:border-gray-700",
                "shadow-sm"
            )}
            onClick={() => onSelect(feed.id)}
        >
            <div className="flex items-center gap-2 truncate">
                <span className="truncate">{feed.name}</span>
            </div>
            <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                    <Badge
                        variant="secondary"
                        className="bg-blue-500 text-white border-none"
                    >
                        {unreadCount}
                    </Badge>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMoveUp(feed.id);
                    }}
                    className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
                    title="Move Up"
                    aria-label="Move Up"
                    disabled={feed.index === 0}
                >
                    <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMoveDown(feed.id);
                    }}
                    className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
                    title="Move Down"
                    aria-label="Move Down"
                >
                    <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMoving(!isMoving)
                    }}
                    className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
                    title="Move to Folder"
                    aria-label="Move to Folder"
                >
                    <FolderSync  className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(feed.id);
                    }}
                    className="h-4 w-4 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100 cursor-pointer"
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove Feed</span>
                </Button>
            </div>
            <AnimatePresence>
                {isMoving && (
                    <>
                     {/* Backdrop */}
                    <div className="fixed inset-0 bg-black opacity-50 z-0" />
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-75 top-half mt-2 w-48 bg-white dark:bg-gray-700 border rounded-md shadow-lg z-10"
                    >
                        <div className="p-2 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-300">Move to Folder:</div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setIsMoving(false);
                                    }}
                                    className="h-4 w-4 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100 cursor-pointer ml-2" // Added margin-left for spacing
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Cancel</span>
                                </Button>
                            </div>

                            <select
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                onChange={(e) => {
                                    const folderId = e.target.value === 'null' ? undefined : e.target.value;
                                    onMoveToFolder(feed.id, folderId);
                                    setIsMoving(false);
                                }}
                                value={parentId ?? 'null'}
                            >
                                <option value="null">Uncategorized</option>
                                {folders.map((folder) => (
                                    <option key={folder.id} value={folder.id}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Current Folder: {currentFolder ? currentFolder.name : 'Uncategorized'}
                            </div>
                        </div>
                    </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SortableFeedItem