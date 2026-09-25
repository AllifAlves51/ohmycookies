import type { SupabaseClient } from "@supabase/supabase-js"

export type Category = {
  id: string
  store_id: string
  name: string
  position: number
  active: boolean
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  store_id: string
  category_id: string | null
  name: string
  description: string | null
  price_cents: number
  promo_price_cents: number | null
  image_url: string | null
  featured: boolean
  active: boolean
  stock_control_enabled: boolean
  stock_quantity: number | null
  position: number
  created_at: string
  updated_at: string
}

export function getCategories(supabase: SupabaseClient, storeId: string) {
  return supabase
    .from("categories")
    .select("*")
    .eq("store_id", storeId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Category[]>()
}

export function createCategory(
  supabase: SupabaseClient,
  storeId: string,
  name: string,
) {
  return supabase
    .from("categories")
    .insert({ store_id: storeId, name })
    .select()
    .single<Category>()
}

export function updateCategory(
  supabase: SupabaseClient,
  categoryId: string,
  patch: Partial<Pick<Category, "name" | "active" | "position">>,
) {
  return supabase.from("categories").update(patch).eq("id", categoryId)
}

export function getProducts(supabase: SupabaseClient, storeId: string) {
  return supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Product[]>()
}

export function getProductById(supabase: SupabaseClient, productId: string) {
  return supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single<Product>()
}

export function createProduct(
  supabase: SupabaseClient,
  storeId: string,
  patch: Omit<Product, "id" | "store_id" | "created_at" | "updated_at">,
) {
  return supabase
    .from("products")
    .insert({ store_id: storeId, ...patch })
    .select()
    .single<Product>()
}

export function updateProduct(
  supabase: SupabaseClient,
  productId: string,
  patch: Partial<
    Pick<
      Product,
      | "name"
      | "description"
      | "category_id"
      | "price_cents"
      | "promo_price_cents"
      | "image_url"
      | "featured"
      | "active"
      | "stock_control_enabled"
      | "stock_quantity"
    >
  >,
) {
  return supabase
    .from("products")
    .update(patch)
    .eq("id", productId)
    .select()
    .single<Product>()
}

export function deleteProduct(supabase: SupabaseClient, productId: string) {
  return supabase.from("products").delete().eq("id", productId)
}
