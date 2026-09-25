"use client"

import { useRef, useState, useTransition } from "react"
import { Check, ChevronRight, Copy, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { saveWhatsappTemplatesAction } from "@/app/(admin)/whatsapp/actions"
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_META,
  TEMPLATE_VARIABLES,
  renderTemplate,
  type TemplateKey,
  type WhatsappTemplates,
} from "@/lib/whatsapp-templates"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export function WhatsappMessagesEditor({
  menuUrl,
  storeName,
  initialTemplates,
}: {
  menuUrl: string
  storeName: string
  initialTemplates: WhatsappTemplates
}) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [savedTemplates, setSavedTemplates] = useState(initialTemplates)
  const [selected, setSelected] = useState<TemplateKey>("greeting")
  const [copied, setCopied] = useState<"menu" | "message" | null>(null)
  const [isSaving, startSaving] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const meta = TEMPLATE_META.find((m) => m.key === selected)!
  const current = templates[selected]
  const isDirty = JSON.stringify(templates) !== JSON.stringify(savedTemplates)
  const variables = TEMPLATE_VARIABLES.filter(
    (v) => meta.kind === "status" || !v.onlyStatus,
  )

  const preview = renderTemplate(current.text, {
    nome: "Maria",
    pedido: 12,
    link_pedido: `${menuUrl}/pedido/…`,
    cardapio: menuUrl,
    loja: storeName,
  })

  function update(patch: Partial<{ enabled: boolean; text: string }>) {
    setTemplates((prev) => ({
      ...prev,
      [selected]: { ...prev[selected], ...patch },
    }))
  }

  function insertVariable(token: string) {
    const el = textareaRef.current
    const start = el?.selectionStart ?? current.text.length
    const end = el?.selectionEnd ?? current.text.length
    update({
      text: current.text.slice(0, start) + token + current.text.slice(end),
    })
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  function copy(text: string, what: "menu" | "message") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(what)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function handleSave() {
    startSaving(async () => {
      const result = await saveWhatsappTemplatesAction(templates)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setSavedTemplates(templates)
      toast.success(result.success ?? "Mensagens salvas")
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Link do cardápio</p>
          <p className="text-muted-foreground truncate text-sm">{menuUrl}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => copy(menuUrl, "menu")}
        >
          {copied === "menu" ? <Check /> : <Copy />}
          {copied === "menu" ? "Copiado!" : "Copiar link"}
        </Button>
      </div>

      <div className="bg-card grid overflow-hidden rounded-xl border md:grid-cols-[240px_1fr]">
        <aside className="bg-muted/40 border-b p-4 md:border-r md:border-b-0">
          <p className="font-semibold">Personalização</p>
          <p className="text-muted-foreground mt-1 mb-4 text-xs">
            Mensagens de boas-vindas e de cada etapa do pedido.
          </p>
          <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0">
            {TEMPLATE_META.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelected(item.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  selected === item.key
                    ? "bg-background text-primary font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    templates[item.key].enabled
                      ? "bg-green-500"
                      : "bg-muted-foreground/40",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                <ChevronRight
                  className={cn(
                    "hidden size-4 md:block",
                    selected !== item.key && "invisible",
                  )}
                />
              </button>
            ))}
          </nav>
        </aside>

        <section className="space-y-5 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">{meta.label}</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                {meta.description}
              </p>
            </div>
            <label className="flex shrink-0 items-center gap-2 text-xs">
              {current.enabled ? "Ativo" : "Inativo"}
              <Switch
                checked={current.enabled}
                onCheckedChange={(enabled) => update({ enabled })}
              />
            </label>
          </div>

          <div className="space-y-3 rounded-xl bg-[#efeae2] p-4 dark:bg-[#0b141a]">
            <div className="ml-auto w-fit max-w-[80%]">
              <p className="text-muted-foreground mb-1 text-right text-[10px]">
                Seu cliente
              </p>
              <div className="rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-sm text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
                {meta.sampleCustomerMessage}
              </div>
            </div>
            <div className="w-fit max-w-[85%]">
              <p className="text-muted-foreground mb-1 text-[10px]">
                {storeName}
              </p>
              <div
                className={cn(
                  "rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm whitespace-pre-wrap text-[#111b21] shadow-sm dark:bg-[#202c33] dark:text-[#e9edef]",
                  !current.enabled && "opacity-50",
                )}
              >
                {preview}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Mensagem personalizada</p>
              <button
                type="button"
                onClick={() =>
                  update({ text: DEFAULT_TEMPLATES[selected].text })
                }
                className="text-primary flex items-center gap-1 text-xs font-medium"
              >
                <RotateCcw className="size-3" />
                Restaurar padrão
              </button>
            </div>
            <Textarea
              ref={textareaRef}
              value={current.text}
              onChange={(e) => update({ text: e.target.value })}
              rows={6}
            />
            <div className="flex flex-wrap gap-1.5">
              <span className="text-muted-foreground py-1 text-xs">
                Inserir:
              </span>
              {variables.map((variable) => (
                <button
                  key={variable.token}
                  type="button"
                  onClick={() => insertVariable(variable.token)}
                  className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs"
                >
                  {variable.label}
                </button>
              ))}
            </div>
          </div>

          {meta.kind === "business" ? (
            <div className="bg-muted/60 space-y-2 rounded-lg p-3 text-xs">
              <p>
                Sem conexão direta com o WhatsApp, esta mensagem é configurada
                no próprio app <strong>WhatsApp Business</strong>. Copie o texto
                abaixo (já com o link do cardápio) e cole lá.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copy(preview, "message")}
              >
                {copied === "message" ? <Check /> : <Copy />}
                {copied === "message" ? "Copiado!" : "Copiar mensagem"}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Ao mudar o pedido para esta etapa, o painel oferece enviar esta
              mensagem ao cliente pelo WhatsApp com um clique.
            </p>
          )}
        </section>
      </div>

      <div className="bg-background/95 sticky bottom-0 flex items-center justify-end gap-3 border-t py-3 backdrop-blur">
        {isDirty ? (
          <span className="text-muted-foreground text-xs">
            Alterações não salvas
          </span>
        ) : null}
        <Button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? "Salvando..." : "Salvar mensagens"}
        </Button>
      </div>
    </div>
  )
}
