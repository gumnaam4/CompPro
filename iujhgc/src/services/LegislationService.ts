export interface LegislationEntry {
  id: string;
  title: string;
  summary: string;
  link: string;
  xmlLink: string;
  date: string;
  type: string;
  category: string;
}

const parseAtomFeed = (xmlText: string): LegislationEntry[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const entries = Array.from(xmlDoc.getElementsByTagName("entry"));

  return entries.map((entry) => {
    const title = entry.getElementsByTagName("title")[0]?.textContent || "Unknown Title";
    const summary = entry.getElementsByTagName("summary")[0]?.textContent || "";
    const id = entry.getElementsByTagName("id")[0]?.textContent || Math.random().toString();
    const date = entry.getElementsByTagName("updated")[0]?.textContent || "";
    
    // Find XML link
    const links = Array.from(entry.getElementsByTagName("link"));
    const xmlLinkTag = links.find(l => l.getAttribute("type") === "application/xml") || 
                       links.find(l => l.getAttribute("rel") === "alternate");
    const xmlLink = xmlLinkTag?.getAttribute("href") || "";
    
    // General link
    const link = links.find(l => l.getAttribute("rel") === "alternate")?.getAttribute("href") || "";

    // Extract type from ukm:DocumentMainType if available
    let type = "Legislation";
    const docMainType = Array.from(entry.childNodes).find(n => n.nodeName.includes("DocumentMainType")) as Element;
    if (docMainType) {
      type = docMainType.getAttribute("Value") || "Legislation";
    }

    // Category mapping logic similar to Python snippet
    let category = "General";
    const dtVal = type.toLowerCase();
    if (dtVal.includes("data") || dtVal.includes("privacy")) category = "Privacy";
    else if (dtVal.includes("finance") || dtVal.includes("tax")) category = "Financial";
    else if (dtVal.includes("security")) category = "Security";
    else if (title.toLowerCase().includes("health")) category = "Healthcare";

    return { id, title, summary, link, xmlLink, date: new Date(date).toLocaleDateString(), type, category };
  });
};

const BACKEND_URL = 'http://localhost:5000/api/legislation';

export const fetchLatestLegislation = async (page = 1): Promise<LegislationEntry[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/all/data.feed?page=${page}`);
    if (!response.ok) throw new Error("Failed to fetch");
    const text = await response.text();
    return parseAtomFeed(text);
  } catch (error) {
    console.error("Error fetching latest legislation:", error);
    return [];
  }
};

export const searchLegislation = async (query: string): Promise<LegislationEntry[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/all/data.feed?title=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Search failed");
    const text = await response.text();
    return parseAtomFeed(text);
  } catch (error) {
    console.error("Error searching legislation:", error);
    return [];
  }
};

export const fetchDocumentContent = async (xmlUrl: string): Promise<string> => {
  try {
    // Check if xmlUrl is absolute or relative
    const path = xmlUrl.startsWith("https://www.legislation.gov.uk") 
      ? xmlUrl.replace("https://www.legislation.gov.uk", "") 
      : xmlUrl;
    
    const response = await fetch(`${BACKEND_URL}${path}`);
    if (!response.ok) throw new Error("Failed to fetch document");
    const text = await response.text();
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const legislation = xmlDoc.getElementsByTagName("Legislation")[0];
    
    return legislation ? legislation.textContent || "No content found" : "No content found";
  } catch (error) {
    console.error("Error fetching document content:", error);
    return "Error loading content.";
  }
};
