import { motion, AnimatePresence } from 'framer-motion';
import { SortableFolderItemProps } from '@/lib/types';
import { Trash2, Folder as FolderClosed, FolderOpen, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SortableFeedItem from '@/components/sortable/SortableFeedItem';


const SortableFolderItem: React.FC<SortableFolderItemProps> = ({
    folder,
    feeds,
    onRemoveFolder,
    onRemoveFeed,
    onSelectFeed,
    onAddToFolder,
    expandedFolders,
    onToggleFolder,
    unreadCounts,
    onMoveUp,
    onMoveDown,
    folders,
  }) => {
    //const [isAddingToFolder, setIsAddingToFolder] = useState(false);
    //const [selectedFeedToAdd, setSelectedFeedToAdd] = useState<string | null>(null);
  
    const folderFeeds = feeds.filter((feed) => feed.folderId === folder.id);
    const folderUnreadCount = folderFeeds.reduce((acc, feed) => {
      return acc + (unreadCounts[feed.id] || 0);
    }, 0);
  
    return (
      <div className="space-y-2">
        <div className="w-full flex items-center justify-between p-2 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
          <Button
            variant="ghost"
            className=" flex items-center justify-between px-0  text-gray-700 dark:text-gray-300 cursor-pointer"
            onClick={() => onToggleFolder(folder.id)}
          >
            <div className="flex items-center gap-2 w-full justify-start truncate">
              {expandedFolders.includes(folder.id) ? (
                <FolderOpen className="w-4 h-4 text-gray-100" />
              ) : (
                <FolderClosed className="w-4 h-4 text-gray-400" />
              )}
              <span className={expandedFolders.includes(folder.id) ? "truncate text-gray-100" : "truncate text-gray-400"}>{folder.name}</span>
            </div>
          </Button>
          {folderUnreadCount > 0 && (
            <Badge variant="secondary" className="bg-blue-500 text-white border-none">
              {folderUnreadCount}
            </Badge>
          )}
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(folder.id);
              }}
              className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
              title="Move Folder Up"
              aria-label="Move Folder Up"
              disabled={folder.index === 0}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(folder.id);
              }}
              className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
              title="Move Folder Down"
              aria-label="Move Folder Down"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFolder(folder.id);
              }}
              className="h-4 w-4 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove Folder</span>
            </Button>
          </div>
        </div>
        <AnimatePresence>
          {expandedFolders.includes(folder.id) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1 ml-4"
            >
              {folderFeeds.map((feed) => {
                const unreadCount = unreadCounts[feed.id] || 0;
                const feedId = feed.id;
                return (
                  <SortableFeedItem
                    key={feedId}
                    feed={feed}
                    onRemove={onRemoveFeed}
                    onSelect={(id) => onSelectFeed(id)}
                    unreadCount={unreadCount}
                    parentId={folder.id} // Pass folder ID as parentId
                    onMoveUp={(id) => onMoveUp(id)}
                    onMoveDown={(id) => onMoveDown(id)}
                    onMoveToFolder={(feedId, id) => onAddToFolder(feedId, id)}
                    folders={folders}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  export default SortableFolderItem;