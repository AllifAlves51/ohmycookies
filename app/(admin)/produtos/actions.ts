"use server"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { reaisToCents } from "@/lib/utils/money"
import {
  categorySchema,
  productSchema,
  NO_CATEGORY_VALUE,
} from "@/lib/validations/product"
import { getStoreByOwnerId } from "@/lib/services/store"
import {
  createCategory,
  updateCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} from "@/lib/services/product"

export type ProductActionState = {
  error?: string
  success?: string
}

async function requireOwnedStore(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: store } = await getStoreByOwnerId(supabase, user.id)
  return store
}

function parseProductFormData(formData: FormData) {
  const categoryIdRaw = formData.get("categoryId")

  return productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    categoryId: categoryIdRaw === NO_CATEGORY_VALUE ? null : categoryIdRaw,
    price: formData.get("price"),
    promoPrice: formData.get("promoPrice") ?? "",
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    stockControlEnabled: formData.get("stockControlEnabled") === "on",
    stockQuantity: formData.get("stockQuantity") ?? "",
  })
}

async function uploadProductImage(
  supabase: SupabaseClient,
  storeId: string,
  productId: string,
  file: File,
) {
  const extension = file.name.split(".").pop() ?? "jpg"
  const path = `${storeId}/${productId}/image-${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: true })

  if (error) {
    return null
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path)

  return publicUrl
}

export async function createCategoryAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = categorySchema.safeParse({ name: formData.get("name") })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { error } = await createCategory(supabase, store.id, parsed.data.name)

  if (error) {
    return { error: "Não foi possível criar a categoria" }
  }

  revalidatePath("/produtos")
  return { success: "Categoria criada" }
}

export async function toggleCategoryActiveAction(
  categoryId: string,
  active: boolean,
) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  await updateCategory(supabase, categoryId, { active })
  revalidatePath("/produtos")
}

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = parseProductFormData(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const imageFile = formData.get("image")
  if (
    imageFile instanceof File &&
    imageFile.size > 4 * 1024 * 1024
  ) {
    return { error: "A imagem deve ter no máximo 4MB" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { data: product, error } = await createProduct(supabase, store.id, {
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price_cents: reaisToCents(parsed.data.price),
    promo_price_cents: parsed.data.promoPrice
      ? reaisToCents(parsed.data.promoPrice)
      : null,
    image_url: null,
    featured: parsed.data.featured,
    active: parsed.data.active,
    stock_control_enabled: parsed.data.stockControlEnabled,
    stock_quantity: parsed.data.stockControlEnabled
      ? Number(parsed.data.stockQuantity)
      : null,
    position: 0,
  })

  if (error || !product) {
    return { error: "Não foi possível criar o produto" }
  }

  const file = formData.get("image")
  if (file instanceof File && file.size > 0) {
    const publicUrl = await uploadProductImage(
      supabase,
      store.id,
      product.id,
      file,
    )
    if (publicUrl) {
      await updateProduct(supabase, product.id, { image_url: publicUrl })
    }
  }

  revalidatePath("/produtos")
  return { success: "Produto criado" }
}

export async function updateProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const productId = formData.get("productId")

  if (typeof productId !== "string" || !productId) {
    return { error: "Produto inválido" }
  }

  const parsed = parseProductFormData(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const imageFile = formData.get("image")
  if (
    imageFile instanceof File &&
    imageFile.size > 4 * 1024 * 1024
  ) {
    return { error: "A imagem deve ter no máximo 4MB" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  let imageUrl: string | undefined
  const file = formData.get("image")
  if (file instanceof File && file.size > 0) {
    const publicUrl = await uploadProductImage(
      supabase,
      store.id,
      productId,
      file,
    )
    if (publicUrl) {
      imageUrl = publicUrl
    }
  }

  const { error } = await updateProduct(supabase, productId, {
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price_cents: reaisToCents(parsed.data.price),
    promo_price_cents: parsed.data.promoPrice
      ? reaisToCents(parsed.data.promoPrice)
      : null,
    ...(imageUrl ? { image_url: imageUrl } : {}),
    featured: parsed.data.featured,
    active: parsed.data.active,
    stock_control_enabled: parsed.data.stockControlEnabled,
    stock_quantity: parsed.data.stockControlEnabled
      ? Number(parsed.data.stockQuantity)
      : null,
  })

  if (error) {
    return { error: "Não foi possível salvar o produto" }
  }

  revalidatePath("/produtos")
  return { success: "Produto atualizado" }
}

export async function toggleProductActiveAction(
  productId: string,
  active: boolean,
) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  await updateProduct(supabase, productId, { active })
  revalidatePath("/produtos")
}

export async function deleteProductAction(productId: string) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  const { data: product } = await getProductById(supabase, productId)

  if (!product || product.store_id !== store.id) {
    return
  }

  await deleteProduct(supabase, productId)
  revalidatePath("/produtos")
}

export async function duplicateProductAction(productId: string) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  const { data: original } = await getProductById(supabase, productId)

  if (!original || original.store_id !== store.id) {
    return
  }

  await createProduct(supabase, store.id, {
    category_id: original.category_id,
    name: `${original.name} (cópia)`,
    description: original.description,
    price_cents: original.price_cents,
    promo_price_cents: original.promo_price_cents,
    image_url: original.image_url,
    featured: false,
    active: false,
    stock_control_enabled: original.stock_control_enabled,
    stock_quantity: original.stock_quantity,
    position: original.position,
  })

  revalidatePath("/produtos")
}
