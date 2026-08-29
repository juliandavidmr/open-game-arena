# Keep analytics privacy-minimized

Open Game Arena will expose an internal Analytics facade with a no-op adapter in the MVP and may add Google Analytics or another provider later. The facade accepts only allowlisted operational product properties such as surface, lifecycle state, ending cause, duration, and error code; capability tokens, full paths, User-Agent, client/model metadata, prompts, and raw MCP payloads are forbidden even when some related data later appears on a public Completed Match page.
