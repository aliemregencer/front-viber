import { Component, OnInit, signal } from '@angular/core';
import { FuturamaService } from './services/futurama.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  characters = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  searchQuery = signal('');
  genderFilter = signal<'all' | 'male' | 'female' | 'other'>('all');
  sortOrder = signal<'asc' | 'desc'>('asc');

  currentPage = 1;
  itemsPerPage = 9;

  constructor(private futuramaService: FuturamaService) {}

  ngOnInit() {
    this.futuramaService.getCharacters().subscribe({
      next: (data) => {
        this.characters.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Bilinmeyen hata');
        this.loading.set(false);
      }
    });
  }

  trackById(index: number, item: any): any {
    return item.id || index;
  }

  get filteredCharacters() {
    const query = this.searchQuery().toLowerCase();
    const gender = this.genderFilter();
    const order = this.sortOrder();

    let result = this.characters().filter((karakter) => {
      const fullName = `${karakter.name?.first ?? ''} ${karakter.name?.last ?? ''}`.toLowerCase();
      const genderMatch = gender === 'all' || karakter.gender?.toLowerCase() === gender;
      return fullName.includes(query) && genderMatch;
    });

    result = result.sort((a, b) => {
      const aName = `${a.name?.first ?? ''} ${a.name?.last ?? ''}`.toLowerCase();
      const bName = `${b.name?.first ?? ''} ${b.name?.last ?? ''}`.toLowerCase();
      return order === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
    });

    return result;
  }
}
