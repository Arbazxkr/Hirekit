import re

with open('src/app/profile/page.tsx', 'r') as f:
    text = f.read()

# 1. Interface
search_interface = r'target_role: string;\n    resume_text\?: string;\n\}'
replace_interface = '''target_role: string;
    resume_text?: string;
    username?: string;
    avatar_url?: string;
}'''
text = re.sub(search_interface, replace_interface, text)

# 2. State
search_state = r'const \[name, setName\] = useState\(""\);'
replace_state = '''const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");'''
text = re.sub(search_state, replace_state, text)

# 3. Load
search_load = r'setName\(data\.profile\.name \|\| ""\);'
replace_load = '''setName(data.profile.name || "");
                setUsername(data.profile.username || "");
                setAvatarUrl(data.profile.avatar_url || "");'''
text = re.sub(search_load, replace_load, text)

# 4. Save
search_save = r'name,\n\s*skills:'
replace_save = '''name,
                    username,
                    avatar_url: avatarUrl,
                    skills:'''
text = re.sub(search_save, replace_save, text)

# 5. Top Card UI
search_card = r'''\{user\.avatar \? \(\s*<img src=\{user\.avatar\} alt="" style=\{\{ width: 56, height: 56, borderRadius: "50%" \}\}.*?</button>\s*\)}\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>''' # Just kidding, let's use exact match

search_card = r'''\{user\.avatar \? \(\s*<img src=\{user\.avatar\}.*?\)\s*:\s*\(\s*<div.*?>\s*\{\(user\.name \|\| "\?"\)\[0\]\.toUpperCase\(\)\}\s*</div>\s*\)\}\s*<div style=\{\{ flex: 1 \}\}>\s*<div style=\{\{ fontSize: 18, fontWeight: 700, color: "#111" \}\}>\{user\.name\}</div>\s*<div style=\{\{ fontSize: 13, color: "#888" \}\}>\{user\.email\}</div>\s*</div>'''

replace_card = '''{(profile?.avatar_url || user.avatar) ? (
                        <img src={profile?.avatar_url || user.avatar} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#888" }}>
                            {(profile?.name || user.name || "?")[0].toUpperCase()}
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{profile?.name || user.name}</div>
                        {profile?.username && <div style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>@{profile.username}</div>}
                        <div style={{ fontSize: 13, color: "#888" }}>{user.email}</div>
                    </div>'''
text = re.sub(search_card, replace_card, text)

# 6. Edit form
search_edit = r'\{ label: "Full Name", value: name, set: setName \},'
replace_edit = '''{ label: "Avatar Image URL", value: avatarUrl, set: setAvatarUrl, placeholder: "e.g. https://example.com/me.png" },
                                    { label: "Username", value: username, set: setUsername, placeholder: "e.g. johndoe" },
                                    { label: "Full Name", value: name, set: setName },'''
text = re.sub(search_edit, replace_edit, text)

with open('src/app/profile/page.tsx', 'w') as f:
    f.write(text)

