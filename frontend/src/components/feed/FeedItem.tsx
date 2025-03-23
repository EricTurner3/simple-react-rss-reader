import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FeedItemProps } from "@/lib/types";

// Displays a single feed item
const FeedItem: React.FC<FeedItemProps> = ({ item, isRead, onRead }) => {
    const title = item.title?._cdata || item.title?.text || "Untitled";
    const link = item.link;
    const description = item.description?._cdata || item.description?.text || "No description available.";
    const pubDate = item.pubDate 
        ? typeof item.pubDate === 'string' ? new Date(item.pubDate).toLocaleString() : item.pubDate._text
            ? new Date(item.pubDate._text).toLocaleString() : 'Unknown date'
        : 'Unknown date';
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
        >
            <Card
                className={cn(
                    "mb-4 hover:shadow-lg transition-shadow cursor-pointer",
                    isRead ? "bg-gray-50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-800"
                )}
                onClick={() => {
                    if (!isRead) {
                        onRead(link);
                    }
                    window.open(link, '_blank');
                }}
            >
                <CardHeader>
                    <CardTitle>
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "hover:underline",
                                isRead ? "text-gray-500 dark:text-gray-400" : "text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                            )}
                        >
                            {title}
                        </a>
                    </CardTitle>
                    <CardDescription className={isRead ? "text-gray-400" : "text-gray-100"}>{pubDate}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className={cn(
                        "text-gray-700 dark:text-gray-300",
                        isRead && "text-gray-500 dark:text-gray-400"
                    )}
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default FeedItem;