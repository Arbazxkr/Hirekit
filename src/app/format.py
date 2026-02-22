import re

with open('page.tsx', 'r') as f:
    original = f.read()

# Add rendered content
helper = """const renderMessageContent = (content: string) => {
    if (content.startsWith("📎 Attached: ")) {
        const filename = content.replace("📎 Attached: ", "");
        return (
            <div style={{ 
                padding: "8px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 12, 
                display: "inline-flex", alignItems: "center", gap: 8,
                border: "1px solid rgba(255,255,255,0.2)"
            }}>
                <Paperclip size={14} color="#bbb" />
                <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{filename}</span>
            </div>
        );
    }
    
    if (content.includes("[Attached File Context]")) {
        const parts = content.split("\\n\\n[Attached File Context]\\n");
        const userText = parts[0].trim();
        const fileDetail = parts.length > 1 ? parts[1] : parts[0];
        
        let filename = "document";
        const match = fileDetail.match(/I uploaded "(.*)"\\. Content:/);
        if (match) filename = match[1];

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                {userText && userText !== fileDetail && <div style={{ whiteSpace: "pre-wrap" }}>{userText}</div>}
                <div style={{ 
                    padding: "8px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 12, 
                    display: "inline-flex", alignItems: "center", gap: 8, 
                    border: "1px solid rgba(255,255,255,0.2)"
                }}>
                    <Paperclip size={14} color="#bbb" />
                    <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{filename}</span>
                </div>
            </div>
        );
    } 
    
    if (content.startsWith('I uploaded "') && content.includes('". Content:\\n')) {
        const match = content.match(/I uploaded "(.*)"\\. Content:/);
        const filename = match ? match[1] : "document";
        return (
            <div style={{ 
                padding: "8px 12px", background: "rgba(255,255,255,0.1)", borderRadius: 12, 
                display: "inline-flex", alignItems: "center", gap: 8,
                border: "1px solid rgba(255,255,255,0.2)"
            }}>
                <Paperclip size={14} color="#bbb" />
                <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{filename}</span>
            </div>
        );
    }
    return content;
};

export default function Home() {
"""

original = original.replace("export default function Home() {", helper)

# Update {msg.content} to use the helper if it's the user
search_content_render = r'\{msg\.content\}'
repl_content_render = '{msg.role === "user" ? renderMessageContent(msg.content) : msg.content}'
original = original.replace(search_content_render, repl_content_render)

# Replace the File UI preview component
search_preview = '''<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ padding: 6, background: "#fff", borderRadius: 8, border: "1px solid #e5e5e5" }}>
                                        <Paperclip size={14} color="#666" />
                                    </div>
                                    <span style={{ fontSize: 13, color: "#333", fontWeight: 500, maxWidth: 200, WebkitLineClamp: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{selectedFile.name}</span>
                                </div>'''

repl_preview = '''<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {selectedFile.type.startsWith("image/") ? (
                                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6, border: "1px solid #ddd" }} />
                                    ) : (
                                        <div style={{ padding: 6, background: "#fff", borderRadius: 8, border: "1px solid #e5e5e5" }}>
                                            <Paperclip size={14} color="#666" />
                                        </div>
                                    )}
                                    <span style={{ fontSize: 13, color: "#333", fontWeight: 500, maxWidth: 200, WebkitLineClamp: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{selectedFile.name}</span>
                                </div>'''

original = original.replace(search_preview, repl_preview)

with open('page.tsx', 'w') as f:
    f.write(original)

