import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Country } from './country.entity';
import { State } from './state.entity';
import { City } from './city.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(State)
    private readonly stateRepo: Repository<State>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
  ) {}

  // ── Countries ──────────────────────────────────────────────────────────────

  findCountries(activeOnly = true) {
    return this.countryRepo.find({
      where: activeOnly ? { isActive: true } : {},
      order: { name: 'ASC' },
    });
  }

  async findCountry(id: string) {
    const country = await this.countryRepo.findOne({ where: { id } });
    if (!country) throw new NotFoundException(`Country not found: ${id}`);
    return country;
  }

  async createCountry(data: Partial<Country>) {
    const entity = this.countryRepo.create(data);
    return this.countryRepo.save(entity);
  }

  async updateCountry(id: string, data: Partial<Country>) {
    await this.findCountry(id);
    await this.countryRepo.update(id, data);
    return this.findCountry(id);
  }

  // ── States ─────────────────────────────────────────────────────────────────

  findStates(countryId?: string, activeOnly = true) {
    return this.stateRepo.find({
      where: {
        ...(countryId ? { countryId } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      order: { name: 'ASC' },
    });
  }

  async findState(id: string) {
    const state = await this.stateRepo.findOne({
      where: { id },
      relations: ['country'],
    });
    if (!state) throw new NotFoundException(`State not found: ${id}`);
    return state;
  }

  async createState(data: Partial<State>) {
    await this.findCountry(data.countryId);
    const entity = this.stateRepo.create(data);
    return this.stateRepo.save(entity);
  }

  async updateState(id: string, data: Partial<State>) {
    await this.findState(id);
    await this.stateRepo.update(id, data);
    return this.findState(id);
  }

  // ── Cities ─────────────────────────────────────────────────────────────────

  findCities(stateId?: string, activeOnly = true) {
    return this.cityRepo.find({
      where: {
        ...(stateId ? { stateId } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      order: { name: 'ASC' },
    });
  }

  async findCity(id: string) {
    const city = await this.cityRepo.findOne({
      where: { id },
      relations: ['state', 'state.country'],
    });
    if (!city) throw new NotFoundException(`City not found: ${id}`);
    return city;
  }

  async searchCities(query: string, limit = 50) {
    if (!query.trim()) return [];
    const term = `%${query.trim()}%`;
    return this.cityRepo.find({
      where: [
        { name: ILike(term), isActive: true },
        { nameAr: ILike(term), isActive: true },
      ],
      relations: ['state', 'state.country'],
      take: limit,
      order: { name: 'ASC' },
    });
  }

  async createCity(data: Partial<City>) {
    await this.findState(data.stateId);
    const entity = this.cityRepo.create(data);
    return this.cityRepo.save(entity);
  }

  async updateCity(id: string, data: Partial<City>) {
    await this.findCity(id);
    await this.cityRepo.update(id, data);
    return this.findCity(id);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getStats() {
    const [countries, states, cities] = await Promise.all([
      this.countryRepo.count(),
      this.stateRepo.count(),
      this.cityRepo.count(),
    ]);
    return { countries, states, cities };
  }
}
