import { AnimatePresence } from 'framer-motion';
import FeedItem from '@/components/feed/FeedItem';
import { Feed } from '@/lib/types';

// Displays a list of feed items
const FeedList = ({ items, readItems, onRead }: { items: Feed[], readItems: Set<string>, onRead: (link: string) => void }) => {
    if (!items || items.length === 0) {
        return <p className="text-gray-500">No items to display.</p>;
    }
    return (
        <AnimatePresence>
            {items.map((item, index) => {
                const link = item.link;
                const isRead = readItems.has(link);
                return (
                    <FeedItem
                        key={index}
                        item={item}
                        isRead={isRead}
                        onRead={onRead}
                    />
                )
            })}
        </AnimatePresence>
    );
};

export default FeedList;