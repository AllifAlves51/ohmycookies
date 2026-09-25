# Robô do WhatsApp — instalação da Evolution API

O robô (saudação automática, avisos de status e alerta de novo pedido) usa a
[Evolution API](https://github.com/EvolutionAPI/evolution-api), um programa
gratuito que mantém o WhatsApp da loja conectado como um "aparelho conectado"
(igual ao WhatsApp Web). Ele precisa ficar **ligado 24h** num servidor — a
Vercel não serve para isso.

Este guia usa uma máquina **grátis para sempre** da Oracle Cloud.

> ⚠️ A conexão não é oficial da Meta. Use só para responder clientes e avisar
> sobre pedidos — nunca para disparos em massa — para minimizar o risco de
> restrição do número.

---

## 1. Criar o servidor (Oracle Cloud Always Free)

1. Crie uma conta em <https://cloud.oracle.com> (pede cartão só para
   verificação; o plano Always Free não cobra).
2. **Compute → Instances → Create instance**
   - Image: **Ubuntu 22.04** (ou 24.04)
   - Shape: **Ampere (VM.Standard.A1.Flex)** — 1 OCPU e 6 GB de RAM bastam
   - Baixe a chave SSH que ele gera.
3. Anote o **IP público** da máquina.
4. Libere as portas 80 e 443:
   - Na instância → **Subnet → Security List → Add Ingress Rules**:
     origem `0.0.0.0/0`, protocolo TCP, portas `80` e `443`.

## 2. Instalar o Docker

Conecte por SSH (`ssh -i chave.key ubuntu@SEU_IP`) e rode:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# As imagens Ubuntu da Oracle bloqueiam portas no firewall interno também:
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
exit
```

Conecte de novo (para o grupo `docker` valer).

## 3. Subir a Evolution API

Endereço HTTPS grátis, sem registrar domínio: troque os pontos do IP por
hífens e use `.sslip.io`. Ex.: IP `129.151.10.20` →
`129-151-10-20.sslip.io`.

```bash
mkdir ~/evolution && cd ~/evolution
```

Crie o arquivo `.env` (`nano .env`), trocando os valores em MAIÚSCULAS:

```env
SERVER_URL=https://SEU-IP-COM-HIFENS.sslip.io
AUTHENTICATION_API_KEY=GERE_UMA_CHAVE_LONGA_ALEATORIA
LANGUAGE=pt-BR
DEL_INSTANCE=false

DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution:SENHA_DO_BANCO@postgres:5432/evolution
DATABASE_CONNECTION_CLIENT_NAME=evolution
DATABASE_SAVE_DATA_INSTANCE=true
# O sistema não precisa do histórico de conversas; economiza disco.
DATABASE_SAVE_DATA_NEW_MESSAGE=false
DATABASE_SAVE_MESSAGE_UPDATE=false
DATABASE_SAVE_DATA_CONTACTS=false
DATABASE_SAVE_DATA_CHATS=false
DATABASE_SAVE_DATA_HISTORIC=false
DATABASE_SAVE_DATA_LABELS=false

CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://redis:6379/6
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_LOCAL_ENABLED=false

CONFIG_SESSION_PHONE_CLIENT=Oh My Cookies
CONFIG_SESSION_PHONE_NAME=Chrome

POSTGRES_USER=evolution
POSTGRES_PASSWORD=SENHA_DO_BANCO
POSTGRES_DB=evolution
```

> Para gerar chaves aleatórias: `openssl rand -hex 32`

Crie o `docker-compose.yml` (`nano docker-compose.yml`):

```yaml
services:
  api:
    image: evoapicloud/evolution-api:latest
    restart: always
    env_file: .env
    depends_on: [postgres, redis]
    volumes:
      - instances:/evolution/instances

  postgres:
    image: postgres:15
    restart: always
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data

  caddy:
    image: caddy:2
    restart: always
    ports: ["80:80", "443:443"]
    command: caddy reverse-proxy --from SEU-IP-COM-HIFENS.sslip.io --to api:8080
    volumes:
      - caddydata:/data

volumes:
  instances:
  pgdata:
  redisdata:
  caddydata:
```

Suba tudo:

```bash
docker compose up -d
docker compose logs -f api   # Ctrl+C para sair
```

Teste no navegador: `https://SEU-IP-COM-HIFENS.sslip.io` deve responder com
uma mensagem de boas-vindas da Evolution API.

## 4. Configurar o sistema (Vercel + Supabase)

1. **Supabase → SQL Editor**: rode o conteúdo de
   `supabase/migrations/20260925130000_whatsapp_bot.sql`
   (e o `20260925120000_whatsapp_message_templates.sql`, se ainda não rodou).
2. **Vercel → Project → Settings → Environment Variables** (Production):

   | Variável | Valor |
   | --- | --- |
   | `EVOLUTION_API_URL` | `https://SEU-IP-COM-HIFENS.sslip.io` |
   | `EVOLUTION_API_KEY` | o mesmo `AUTHENTICATION_API_KEY` do `.env` |
   | `WHATSAPP_WEBHOOK_SECRET` | outra chave aleatória (`openssl rand -hex 32`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` |

3. Faça um **Redeploy** na Vercel para as variáveis valerem.

## 5. Conectar

1. No painel: **WhatsApp → Conectar WhatsApp**.
2. No celular da loja: **WhatsApp → Aparelhos conectados → Conectar um
   aparelho** e leia o QR code.
3. Pronto: o status muda para **Conectado**.
4. No app **WhatsApp Business**, desative a **Mensagem de saudação** (o robô
   passa a fazer isso), para o cliente não receber duas.

## Manutenção

- Atualizar a Evolution API: `cd ~/evolution && docker compose pull && docker compose up -d`
- Ver erros: `docker compose logs --tail 100 api`
- Se o painel mostrar **Desconectado**, basta clicar em **Conectar WhatsApp** e
  ler o QR de novo. Enquanto estiver desconectado, o painel volta a oferecer o
  envio manual das mensagens.
