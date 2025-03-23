export interface Feed {
    id: string;
    link: string;
    name: string;
    folderId?: string;
    index: number;
}

export interface Folder {
    id: string;
    name: string;
    index: number;
}

export interface FeedItemData {
    title?: {
      _cdata: string;
      text?: string;
    };
    link: string 
    description?: {
      _cdata?: string;
      text?: string;
    };
    pubDate?: string | {
      _text?: string;
    };
  }
  
export interface FeedItemProps {
    item: FeedItemData;
    isRead: boolean;
    onRead: (link: string) => void;
}

type ParsedXMLValue =
  | string
  | number
  | boolean
  | null
  | ParsedXMLObject
  | ParsedXMLObject[];

export interface ParsedXMLObject {
  [key: string]: ParsedXMLValue | ParsedXMLObject | ParsedXMLObject[] | undefined; // Allow array of objects
  rss?: ParsedXMLObject;
  channel?: ParsedXMLObject;
  item?: ParsedXMLObject | ParsedXMLObject[];
  entry?: ParsedXMLObject | ParsedXMLObject[];
}

export interface SortableFeedItemProps {
    feed: Feed;
    onRemove: (id: string) => void;
    onSelect: (id: string) => void;
    unreadCount: number;
    parentId: string | null;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    onMoveToFolder: (id: string, folderId: string) => void;
    folders: Folder[];
  }

export interface SortableFolderItemProps {
    folder: Folder;
    feeds: Feed[];
    onRemoveFolder: (id: string) => void;
    onRemoveFeed: (id: string) => void;
    onSelectFeed: (id: string) => void;
    onAddToFolder: (feedId: string, folderId: string) => void;
    expandedFolders: string[];
    onToggleFolder: (id: string) => void;
    unreadCounts: { [key: string]: number };
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    folders: Folder[];
  }
