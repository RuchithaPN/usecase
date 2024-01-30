import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CovidService } from '../covid.service';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.css']
})
export class PaginatorComponent {
  @Input() pageSize: number = 5;
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;

  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  changePageSize(event: any) {
    const newSize = +event.target.value;
    this.pageSize = newSize;
    this.pageSizeChange.emit(newSize); // Emit the updated pageSize value
    this.pageChange.emit(1); // Reset to the first page when changing pageSize
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(page);
    }
  }
}