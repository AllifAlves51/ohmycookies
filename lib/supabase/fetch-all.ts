import type { PostgrestError } from "@supabase/supabase-js"

const PAGE_SIZE = 1000

type PageResult<T> = { data: T[] | null; error: PostgrestError | null }

/** Supabase caps every response at 1000 rows (PostgREST max-rows) and
 * truncates *silently*, so any "load everything and sum it" query must page
 * through. `page` builds the query for one inclusive range and must use a
 * stable order (add a unique column such as id to the ordering). */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<PageResult<T>> {
  const rows: T[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) return { data: null, error }
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null }
  }
}
