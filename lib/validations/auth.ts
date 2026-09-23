import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const signUpSchema = z
  .object({
    storeName: z.string().trim().min(2, "Informe o nome da loja"),
    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail")
      .email("E-mail inválido"),
    password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

export type SignUpInput = z.infer<typeof signUpSchema>
