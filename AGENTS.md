<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- AI calls live only in server routes `src/routes/api/chat.ts` (UI-message stream) and `src/routes/api/generate.ts` (plain text stream for email/schedule); gateway setup is in `src/lib/ai/gateway.server.ts`. Why: keeps the API key and prompts server-side.
- Tasks and chat history are stored in browser localStorage (`src/lib/tasks.ts`, chat page), no sign-in. Why: user chose no accounts.
