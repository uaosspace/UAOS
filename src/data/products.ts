import type {CatalogProduct} from '../types'
import {fetchMembers} from './members'

/**
 * Нормализует embedded products участников в плоский read-model для будущего каталога.
 */
export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  const members = await fetchMembers()

  return members.flatMap((member) =>
    (member.products || []).map((product) => ({
      id: product.id,
      memberId: member.id,
      memberSlug: member.slug,
      memberShortName: member.shortName,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      priceLabel: product.price,
    }))
  )
}
