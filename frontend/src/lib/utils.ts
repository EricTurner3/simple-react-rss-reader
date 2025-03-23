import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { xml2json } from 'xml-js';
import { ParsedXMLObject } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseXML = async (xml: string): Promise<ParsedXMLObject> => {
    try {
        return JSON.parse(xml2json(xml, { compact: true, spaces: 4 })) as ParsedXMLObject; // Parse JSON string and cast to ParsedXMLObject
    } catch (error) {
        console.error("Failed to parse XML:", error);
        throw new Error("Failed to parse XML. Please check your feed URL.");
    }
};

export const extractItems = (parsedData: ParsedXMLObject) => {;
        let items = [];
        if (parsedData.rss) {
            const channel = parsedData.rss.channel;
            if (channel?.item) {
                items = Array.isArray(channel.item) ? channel.item : [channel.item];
            } else {
                throw new Error("Invalid RSS feed format: No items found.");
            }
        } else if (parsedData.feed) {
          if(parsedData.feed){
            items = parsedData.feed.entry;
          }
        } else {
            throw new Error("Invalid RSS/Atom feed format: No items found.");
        }
        return items;
};
