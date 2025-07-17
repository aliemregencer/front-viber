import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { CharactersRoutingModule } from './characters-routing.module';
import { CharacterListComponent } from './components/character-list/character-list.component';
import { CharacterCardComponent } from './components/character-card/character-card.component';
import { SearchFilterComponent } from './components/search-filter/search-filter.component';

@NgModule({
  declarations: [
    CharacterListComponent,
    CharacterCardComponent,
    SearchFilterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    CharactersRoutingModule
  ]
})
export class CharactersModule { }