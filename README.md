# OhMyCookies

SaaS simples para gestão de uma loja de cookies com delivery: painel administrativo (produtos, pedidos em tempo real, clientes, entrega, relatórios) e cardápio público para os clientes fazerem pedidos.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Postgres, Auth, Storage, Realtime) · Vercel

## Setup local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um projeto no [Supabase](https://supabase.com) e copie a **Project URL** e a **anon/publishable key** em Settings → API.

3. Copie `.env.example` para `.env.local` e preencha:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

4. Aplique as migrations em `supabase/migrations/` no SQL Editor do Supabase, **na ordem dos nomes de arquivo** (cada arquivo é numerado sequencialmente).

5. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000). Crie uma conta em `/cadastro` — uma loja é criada automaticamente para o usuário.

## Scripts

```bash
npm run dev           # servidor de desenvolvimento
npm run build         # build de produção
npm run lint          # ESLint
npm run format        # Prettier (aplica)
npm run format:check  # Prettier (só verifica)
```

## Deploy no Vercel

1. Conecte o repositório no [Vercel](https://vercel.com/new).
2. Configure as variáveis de ambiente do projeto (mesmas do `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Garanta que todas as migrations de `supabase/migrations/` já foram aplicadas no projeto Supabase de produção antes do primeiro acesso.
4. Deploy.

## Estrutura

- `app/(public)/cardapio/[slug]` — cardápio público (mobile-first)
- `app/(admin)/*` — painel administrativo (protegido por auth)
- `app/(auth)/*` — login e cadastro
- `lib/services/` — acesso a dados (Supabase)
- `lib/validations/` — schemas Zod
- `lib/utils/` — formatação, WhatsApp, endereço, horário de funcionamento
- `components/admin/`, `components/public-menu/`, `components/shared/`, `components/ui/`
- `supabase/migrations/` — schema, RLS policies, funções e triggers do banco
