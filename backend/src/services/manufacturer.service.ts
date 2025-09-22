// backend/src/services/manufacturer.service.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Manufacturer } from '../entities/Manufacturer';
import { ApiError } from '../utils/apiError';
import slugify from 'slugify';

export class ManufacturerService {
  private repository: Repository<Manufacturer>;

  constructor() {
    this.repository = AppDataSource.getRepository(Manufacturer);
  }

  async getAll() {
    return this.repository.find({
      order: { name: 'ASC' },
    });
  }

  async getById(id: string) {
    const manufacturer = await this.repository.findOne({ where: { id } });
    if (!manufacturer)
      throw new ApiError(404, 'Producent nie został znaleziony');
    return manufacturer;
  }

  async getBySlug(slug: string) {
    if (!slug.startsWith('marka-producent/')) {
      slug = `marka-producent/${slug}`;
    }

    const manufacturer = await this.repository.findOne({ where: { slug } });

    if (!manufacturer)
      throw new ApiError(404, 'Producent nie został znaleziony');
    return manufacturer;
  }

  async create(data: Partial<Manufacturer>) {
    const slug = `marka-producent/${slugify(data.name!, { lower: true, locale: 'pl' })}`;

    const existing = await this.repository.findOne({ where: { slug } });
    if (existing)
      throw new ApiError(400, 'Producent o takiej nazwie już istnieje');

    const manufacturer = this.repository.create({
      ...data,
      slug,
    });

    return await this.repository.save(manufacturer);
  }

  async update(id: string, data: Partial<Manufacturer>) {
    const manufacturer = await this.getById(id);

    if (data.name) {
      data.slug = `marka-producent/${slugify(data.name, { lower: true })}`;
    }

    Object.assign(manufacturer, data);
    return await this.repository.save(manufacturer);
  }

  async delete(id: string) {
    const manufacturer = await this.getById(id);
    await this.repository.remove(manufacturer);
    return { success: true };
  }
}
