import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, PlusCircle, Rss, Loader2, List } from 'lucide-react';
import { parseXML, extractItems } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { Feed, Folder } from '@/lib/types';

import FeedList from '@/components/feed/FeedList';
import SortableFeedItem from './components/sortable/SortableFeedItem';
import SortableFolderItem from './components/sortable/SortableFolderItem';

import './App.css'


// --- Main App Component ---
const RssReaderApp = () => {
    const [feeds, setFeeds] = useState<Feed[]>(() => {
        if (typeof window !== 'undefined') {
            const savedFeeds = localStorage.getItem('rssFeeds');
            return savedFeeds ? JSON.parse(savedFeeds).map((feed: Omit<Feed, 'id' | 'index'>, index: number) => ({
                ...feed,
                id: crypto.randomUUID(),
                index: index
            })) : [];
        }
        return [];
    });
    const [folders, setFolders] = useState<Folder[]>(() => {
        if (typeof window !== 'undefined') {
            const savedFolders = localStorage.getItem('rssFolders');
            return savedFolders ? JSON.parse(savedFolders).map((folder: Omit<Folder, 'id' | 'index'>, index: number) => ({
                ...folder,
                id: crypto.randomUUID(),
                index: index
            })) : [];
        }
        return [];
    });
    const [currentFeedUrl, setCurrentFeedUrl] = useState('');
    const [currentFeedName, setCurrentFeedName] = useState(''); // State for new feed name
    const [currentFolderName, setCurrentFolderName] = useState(''); // State for new folder name
    const [feedData, setFeedData] = useState<{ [id: string]: any[] | null }>({}); // Store feed data by ID
    const [loading, setLoading] = useState<{ [id: string]: boolean }>({}); // Track loading state per feed
    const [error, setError] = useState<{ [id: string]: string | null }>({}); // Track errors per feed
    const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
    const fetchIntervalRef = useRef<{ [id: string]: NodeJS.Timeout | null }>({});
    const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
    const [readItems, setReadItems] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const savedReadItems = localStorage.getItem('readItems');
            return savedReadItems ? new Set(JSON.parse(savedReadItems)) : new Set();
        }
        return new Set();
    });
    const [unreadCounts, setUnreadCounts] = useState<{ [feedId: string]: number }>(() => {
        if (typeof window !== 'undefined') {
            const savedUnreadCounts = localStorage.getItem('unreadCounts');
            return savedUnreadCounts ? JSON.parse(savedUnreadCounts) : {};
        }
        return {};
    });

    // --- Helper Functions ---
    

    const fetchFeed = useCallback(async (feed: Feed) => {
        setLoading(prev => ({ ...prev, [feed.id]: true }));
        setError(prev => ({ ...prev, [feed.id]: null }));
        setFeedData(prev => ({ ...prev, [feed.id]: null }));

        try {
            const response = await fetch(feed.link);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const xmlText = await response.text();
            const parsedData = await parseXML(xmlText);
            const items = extractItems(parsedData);
            setFeedData(prev => ({ ...prev, [feed.id]: items }));

            // Calculate unread count
            const newUnreadCount = items.filter((item: Feed) => {
                const link = item.link;
                return !readItems.has(link);
            }).length;
            setUnreadCounts(prevCounts => ({
                ...prevCounts,
                [feed.id]: newUnreadCount,
            }));

        } catch (err: any) {
            console.error("Error fetching feed:", err);
            if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
                console.log("CORS error detected or fetch failed, trying with proxy...");
                try {
                    const response = await fetch("/api/" + feed.link);
                    if (!response.ok) {
                        throw new Error(`Proxy fetch error! Status: ${response.status}`);
                    }
                    const xmlText = await response.text();
                    const parsedData = await parseXML(xmlText);
                    const items = extractItems(parsedData);
                    setFeedData(prev => ({ ...prev, [feed.id]: items }));
                     // Calculate unread count
                    const newUnreadCount = items.filter((item: Feed) => {
                        const link = item.link;
                        return !readItems.has(link);
                    }).length;
                    setUnreadCounts(prevCounts => ({
                        ...prevCounts,
                        [feed.id]: newUnreadCount,
                    }));
                } catch (proxyError: any) {
                    console.error("Error fetching feed with proxy:", proxyError);
                    setError(prev => ({ ...prev, [feed.id]: proxyError.message || 'Failed to fetch or parse feed using proxy.' }));
                }
            } else {
                setError(prev => ({ ...prev, [feed.id]: err.message || 'Failed to fetch or parse feed.' }));
            }
        } finally {
            setLoading(prev => {
                const newState = { ...prev };
                delete newState[feed.id];
                return newState;
            });
        }
    }, [readItems]);

    const startFetching = (feed: Feed) => {
        fetchFeed(feed);
        fetchIntervalRef.current[feed.id] = setInterval(() => {
            fetchFeed(feed);
        }, 300000);
    };

    // --- Add/Remove Handlers ---
    const addFeed = () => {
        if (currentFeedUrl.trim()) {
            const newFeed: Feed = {
                id: crypto.randomUUID(),
                link: currentFeedUrl.trim(),
                name: currentFeedName.trim() || `Feed ${feeds.length + 1}`,
                folderId: undefined, // Initialize folderId
                index: feeds.filter(f => f.folderId === undefined).length,
            };
            setFeeds([...feeds, newFeed]);
            setCurrentFeedUrl('');
            setCurrentFeedName('');
            setSelectedFeedId(newFeed.id);
        }
    };

    const removeFeed = (id: string) => {
        const feedToRemove = feeds.find(f => f.id === id);

        // Remove associated feed items from folders.
let updatedFeeds: Feed[] = feeds;
        if (feedToRemove) {
            updatedFeeds = feeds.filter(f => f.id !== id);
        }

        // Re-index
        updatedFeeds = updatedFeeds.map((feed, index) => ({ ...feed, index }));
        setFeeds(updatedFeeds);

        setSelectedFeedId(null);
        setFeedData(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });
        if (fetchIntervalRef.current[id]) {
            clearInterval(fetchIntervalRef.current[id]!);
            delete fetchIntervalRef.current[id];
        }
        setUnreadCounts(prevCounts => {
            const newState = { ...prevCounts };
            delete newState[id];
            return newState;
        });
    };

    const addFolder = () => {
        if (currentFolderName.trim()) {
            const newFolder: Folder = {
                id: crypto.randomUUID(),
                name: currentFolderName.trim(),
                index: folders.length,
            };
            setFolders([...folders, newFolder]);
            setCurrentFolderName('');
            setIsAddFolderOpen(false);
        }
    };

    const removeFolder = (id: string) => {
        // Move feeds
        // Move feeds in the folder to uncategorized, and update their index
        let updatedFeeds = feeds.map(feed => {
            if (feed.folderId === id) {
                return {
                    ...feed,
                    folderId: undefined, // Move to uncategorized
                    index: feeds.filter(f => f.folderId === undefined).length // Correct index
                };
            }
            return feed;
        });

        // Re-index the remaining uncategorized feeds
        const uncategorizedFeeds = updatedFeeds.filter(feed => !feed.folderId).sort((a, b) => a.index - b.index);
        uncategorizedFeeds.forEach((feed, index) => {
            updatedFeeds = updatedFeeds.map(f =>
                f.id === feed.id ? { ...f, index: index } : f
            );
        });

        setFeeds(updatedFeeds);
        setFolders(folders.filter(folder => folder.id !== id));
        setExpandedFolders(prev => prev.filter(folderId => folderId !== id));
    };


    const handleFeedSelect = (id: string) => {
        setSelectedFeedId(id);
    };

    const handleAddToFolder = (feedId: string, folderId: string) => {
        // Find the target folder
        const targetFolder = folders.find(f => f.id === folderId);
        if (!targetFolder) return;

        // Find the current folder (or null for uncategorized)
        const currentFolderId = feeds.find(f => f.id === feedId)?.folderId;

        let updatedFeeds = feeds.map(feed => {
            if (feed.id === feedId) {
                return {
                    ...feed,
                    folderId: folderId,
                    index: feeds.filter(f => f.folderId === folderId).length, //set index.
                };
            }
            return feed;
        });

        // Re-index feeds in the source folder (or uncategorized)
        const sourceFeeds = updatedFeeds.filter(f => f.folderId === currentFolderId).sort((a, b) => a.index - b.index);
        sourceFeeds.forEach((feed, index) => {
            updatedFeeds = updatedFeeds.map(f =>
                f.id === feed.id ? { ...f, index: index } : f
            );
        });
        setFeeds(updatedFeeds);
    };

    const handleRemoveFeedFromFolder = (feedId: string) => {
        // Find the feed to remove
        const feedToRemove = feeds.find(f => f.id === feedId);
        if (!feedToRemove) return;

        // Get the folder it's currently in
        const currentFolderId = feedToRemove.folderId;

        let updatedFeeds = feeds.map(feed => {
            if (feed.id === feedId) {
                return {
                    ...feed,
                    folderId: undefined,
                    index: feeds.filter(f => f.folderId === undefined).length, //set index
                };
            }
            return feed;
        });
        //re-index
        const sourceFeeds = updatedFeeds.filter(f => f.folderId === currentFolderId).sort((a, b) => a.index - b.index);
        sourceFeeds.forEach((feed, index) => {
            updatedFeeds = updatedFeeds.map(f =>
                f.id === feed.id ? { ...f, index: index } : f
            );
        });

        setFeeds(updatedFeeds);
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders((prevExpanded) =>
            prevExpanded.includes(folderId)
                ? prevExpanded.filter((id) => id !== folderId)
                : [...prevExpanded, folderId]
        );
    };

     const markLinkAsRead = useCallback((link: string) => {
        setReadItems(prevReadItems => {
            const newReadItems = new Set(prevReadItems);
            newReadItems.add(link);

            // Update unread counts
            setUnreadCounts(prevUnreadCounts => {
                const updatedCounts = { ...prevUnreadCounts };
                for (const feedId in updatedCounts) {
                    const feed = feeds.find(f => f.id === feedId);
                    if (feed) {
                         // Refetch feed data to get accurate item list
                        const items = feedData[feedId] || [];
                        const newUnreadCount = items.filter((item: Feed) => {
                            const itemLink = item.link;
                            return !newReadItems.has(itemLink);
                        }).length;
                        updatedCounts[feedId] = newUnreadCount;
                    }
                }
                return updatedCounts;
            });

            return newReadItems;
        });
    }, [feeds, feedData]);

    // --- Effects ---

    // Save to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('rssFeeds', JSON.stringify(feeds));
            localStorage.setItem('rssFolders', JSON.stringify(folders));
            localStorage.setItem('readItems', JSON.stringify(Array.from(readItems)));
            localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
        }
    }, [feeds, folders, readItems, unreadCounts]);

    // Fetch on mount and when feeds change
    useEffect(() => {
        feeds.forEach(feed => {
            if (!fetchIntervalRef.current[feed.id]) {
                startFetching(feed);
            }
        });

        return () => {
            Object.values(fetchIntervalRef.current).forEach(intervalId => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
            });
            fetchIntervalRef.current = {};
        };
    }, [feeds, fetchFeed]);

    // Select first feed on load if no feed selected.
    useEffect(() => {
        if (feeds.length > 0 && !selectedFeedId) {
            setSelectedFeedId(feeds[0].id);
        }
    }, [feeds, selectedFeedId]);

    // --- Reordering functions ---
    const onMoveFeed = (id: string, direction: 'up' | 'down') => {
        const feedToMove = feeds.find(f => f.id === id);
        if (!feedToMove) return;

        const currentFolderId = feedToMove.folderId;
        let currentFeeds = feeds.filter(feed => feed.folderId === currentFolderId).sort((a, b) => a.index - b.index);

        const currentIndex = currentFeeds.findIndex(f => f.id === id);

        if (direction === 'up' && currentIndex > 0) {
            // Swap with the previous feed
            [currentFeeds[currentIndex - 1], currentFeeds[currentIndex]] = [currentFeeds[currentIndex], currentFeeds[currentIndex - 1]];
        } else if (direction === 'down' && currentIndex < currentFeeds.length - 1) {
            // Swap with the next feed
            [currentFeeds[currentIndex], currentFeeds[currentIndex + 1]] = [currentFeeds[currentIndex + 1], currentFeeds[currentIndex]];
        } else {
            return; // Can't move further
        }

        // Update indexes and merge back into all feeds
        currentFeeds.forEach((feed, index) => {
            currentFeeds = currentFeeds.map(f =>
                f.id === feed.id ? { ...f, index: index } : f
            );
        });

        const updatedFeeds = feeds.map(feed => {
            const movedFeed = currentFeeds.find(f => f.id === feed.id);
            return movedFeed ? { ...movedFeed } : feed;
        });

        setFeeds([...updatedFeeds]);
    };

    const onMoveFeedToFolder = (id: string, folderId: string) => {
        const feedToMove = feeds.find(f => f.id === id);
        if (!feedToMove) return;

        const oldFolderId = feedToMove.folderId;

        let updatedFeeds = feeds.map(feed => {
            if (feed.id === id) {
                return {
                    ...feed,
                    folderId: folderId,
                    index: folderId === undefined ? feeds.filter(f => f.folderId === undefined).length : feeds.filter(f => f.folderId === folderId).length,
                };
            }
            return feed;
        });

        // Re-index feeds in the old folder
        const oldFolderFeeds = updatedFeeds.filter(f => f.folderId === oldFolderId).sort((a, b) => a.index - b.index);
        oldFolderFeeds.forEach((feed, index) => {
            updatedFeeds = updatedFeeds.map(f =>
                f.id === feed.id ? { ...f, index: index } : f
            );
        });

        // Re-index feeds in the new folder
        const newFolderFeeds = updatedFeeds.filter(f => f.folderId === folderId).sort((a, b) => a.index - b.index);
        newFolderFeeds.forEach((feed, index) => {
            updatedFeeds = updatedFeeds.map(f =>
                f.id === feed.id ? { ...f, index: index } : f
            );
        });

        setFeeds(updatedFeeds);
    };

    const onMoveFolder = (id: string, direction: 'up' | 'down') => {
        const folderToMove = folders.find(f => f.id === id);
        if (!folderToMove) return;

        const currentIndex = folderToMove.index;

        if (direction === 'up' && currentIndex > 0) {
            // Swap with the previous folder
            [folders[currentIndex - 1], folders[currentIndex]] = [folders[currentIndex], folders[currentIndex - 1]];
        } else if (direction === 'down' && currentIndex < folders.length - 1) {
            // Swap with the next folder
            [folders[currentIndex], folders[currentIndex + 1]] = [folders[currentIndex + 1], folders[currentIndex]];
        } else {
            return; // Can't move further
        }
        // Update the indexes of the folders
        const updatedFolders = [...folders];
        updatedFolders.forEach((folder, index) => {
            updatedFolders[index] = { ...folder, index: index };
        });
        setFolders(updatedFolders);
    };

    // --- Selected Feed Data ---
    const selectedFeed = feeds.find(feed => feed.id === selectedFeedId);
    const selectedFeedItems = selectedFeed ? feedData[selectedFeed.id] || [] : [];

     // Get unread count for selected feed.
    const selectedFeedUnreadCount = selectedFeed ? unreadCounts[selectedFeed.id] || 0 : 0;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-90 bg-gray-200 dark:bg-gray-800 p-4 border-r border-gray-300 dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Rss className="w-6 h-6 text-blue-500" />
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">RSS Reader</h1>
                </div>

                {/* Add Feed Form */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Add New Feed</h2>
                    <Input
                        type="text"
                        placeholder="Feed Name"
                        value={currentFeedName}
                        onChange={(e) => setCurrentFeedName(e.target.value)}
                        className="mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                    <Input
                        type="text"
                        placeholder="Enter RSS Feed URL"
                        value={currentFeedUrl}
                        onChange={(e) => setCurrentFeedUrl(e.target.value)}
                        className="mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                    <Button
                        onClick={addFeed}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={!currentFeedUrl.trim()}
                    >
                        <PlusCircle className="mr-2 w-4 h-4" />
                        Add Feed
                    </Button>
                </div>

                {/* Add Folder Form */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Folders</h2>
                    <div className="mb-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddFolderOpen(!isAddFolderOpen)}
                            className="w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {isAddFolderOpen ? 'Cancel' : 'Add Folder'}
                        </Button>
                        <AnimatePresence>
                            {isAddFolderOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-2"
                                >
                                    <Input
                                        type="text"
                                        placeholder="Folder Name"
                                        value={currentFolderName}
                                        onChange={(e) => setCurrentFolderName(e.target.value)}
                                        className="mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                                    />
                                    <Button
                                        onClick={addFolder}
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                                        disabled={!currentFolderName.trim()}
                                    >
                                        <PlusCircle className="mr-2 w-4 h-4" />
                                        Add Folder
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Folder List */}
                    <div>
                        {folders.map(folder => (
                            <SortableFolderItem
                                key={folder.id}
                                folder={folder}
                                feeds={feeds}
                                onRemoveFolder={removeFolder}
                                onRemoveFeed={removeFeed}
                                onSelectFeed={handleFeedSelect}
                                onAddToFolder={handleAddToFolder}
                                expandedFolders={expandedFolders}
                                onToggleFolder={toggleFolder}
                                unreadCounts={unreadCounts}
                                onMoveUp={(id) => onMoveFolder(id, 'up')}
                                    onMoveDown={(id) => onMoveFolder(id, 'down')}
                                folders={folders}
                            />
                        ))}
                    </div>
                    {/* Uncategorized Feeds */}
                    <div className="mt-4">
                        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <List className="inline-block mr-2 w-4 h-4" />
                            Uncategorized
                        </h3>
                        {feeds.filter(feed => !feed.folderId).map(feed => {
                            const unreadCount = unreadCounts[feed.id] || 0;
                            return (
                                <SortableFeedItem
                                    key={feed.id}
                                    feed={feed}
                                    onRemove={removeFeed}
                                    onSelect={handleFeedSelect}
                                    unreadCount={unreadCount}
                                    parentId={null}
                                    onMoveUp={(id) => onMoveFeed(id, 'up')}
                                    onMoveDown={(id) => onMoveFeed(id, 'down')}
                                    onMoveToFolder={onMoveFeedToFolder}
                                    folders={folders}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-4">
                {selectedFeed ? (
                    <>
                        <div className='flex items-center gap-2 mb-4'>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 ">
                                {selectedFeed.name}
                            </h2>
                             {selectedFeedUnreadCount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="bg-blue-500 text-white border-none"
                                >
                                    {selectedFeedUnreadCount}
                                </Badge>
                            )}
                        </div>
                        {loading[selectedFeed.id] && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="animate-spin w-5 h-5" />
                                <span>Loading feed...</span>
                            </div>
                        )}
                        {error[selectedFeed.id] && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                    {error[selectedFeed.id]}
                                </AlertDescription>
                            </Alert>
                        )}
                        <FeedList items={selectedFeedItems} readItems={readItems} onRead={markLinkAsRead} />
                    </>
                ) : (
                    <div className="text-center text-gray-500">
                        Select a feed to view its content.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RssReaderApp;

