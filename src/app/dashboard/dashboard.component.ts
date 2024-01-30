import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CountryReports } from '../countryReports';
import { CovidService } from '../covid.service';
import { HostListener } from '@angular/core';
import * as XLSX from 'xlsx';
import * as jsPDF from 'jspdf'; 
import 'jspdf-autotable';
import { HttpClient } from '@angular/common/http';
//import { ExcelService } from '../excel.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  data: CountryReports[] = []; // Your data array
  displayedData: CountryReports[] = [];  // Your data array
  pageSize = 5;   // Number of items per page
  currentPage = 1; // Current page number
  totalPages!: number;  //Total pages
 // displayedData: any[] = []; // to display the table data
  sortColumn: string | null = null; //for sorting
  sortDirection: 'asc' | 'desc' | null = null; // for sort icon
  selectedRow: any = null;//row detail 
  selectedRows: Set<any> = new Set();
  clickedRows = new Set<CountryReports>();//clicked log
  ELEMENT_DATA: CountryReports[] = [];
  input: any;
  dataSource: any;
  selectedCountry: string | null = null;
// Define your existing headers here
  columns: string[] = ['Country', 'Continent', 'Cases', 'Deaths', 'Recovered', 'Active', 'Critical', 'CasesPerOneMillion', 'DeathsPerOneMillion', 'Population'];
  recordForm: any;

  selectCountry(country: string) {
    this.selectedCountry = country;
  }
  

  constructor(private service: CovidService,private http: HttpClient) { }


  

  ngOnInit() {
    this.getAllReports();
    this.filterData();
     const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      this.recentSearches = JSON.parse(savedSearches);
    }
  }
  // onFileSelected(event: any): void {
  //   const file = event.target.files[0];
  
  //   if (file) {
  //     this.readExcelFile(file);
  //   }
  // }
  
  // readExcelFile(file: File): void {
  //   const reader = new FileReader();
  
  //   reader.onload = (e: any) => {
  //     const data = new Uint8Array(e.target.result);
  //     const workbook = XLSX.read(data, { type: 'array' });
  
  //     // Assuming the first sheet in the Excel file contains your data
  //     const firstSheetName = workbook.SheetNames[0];
  //     const worksheet = workbook.Sheets[firstSheetName];
  
  //     // Convert the worksheet to JSON with the correct type
  //     const EData: CountryReports[] = XLSX.utils.sheet_to_json(worksheet, { raw: true });
  
  //     // Merge Excel data with your existing data based on the same headers
  //     this.data = this.data.concat(EData);
  //     this.updateDisplayedData(); // Update the displayed data after merging
  //     this.calculateTotalPages();
  //   };
  
  //   reader.readAsArrayBuffer(file);
  // }
  

  //dData: any[] = [];

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.readExcelData(file);
    }
  }

  readExcelData(file: File): void {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const binaryData = e.target.result;
      const workbook = XLSX.read(binaryData, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      this.displayedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      this.data = this.data.concat(this.displayedData);
      this.updateDisplayedData(); // Update the displayed data after merging
      this.calculateTotalPages();

    };

    reader.readAsBinaryString(file);
  }

  onSubmit(): void {
    const formData = new FormData();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput.files && fileInput.files[0]) {
      formData.append('file', fileInput.files[0]);

      this.http.post('http://localhost:8081/api/excel/upload', formData).subscribe(response => {
        this.displayedData = response as any[];
      });
    }

    this.updateDisplayedData(); // Update the displayed data after merging
    this.calculateTotalPages();
  }



  

  // to display all records
  public getAllReports() {
    this.service.fetchData().subscribe((apiData: any[]) => {
     this.data = apiData; 
     this.calculateTotalPages();
     this.updateDisplayedData();
      //this.selection.clear();
      this.calculateSummary(); // Recalculate summary
    });
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.data.length / this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedData();
    }
  }

updateDisplayedData() {
  const startIndex = (this.currentPage - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;

  // Apply sorting if a column is selected for sorting
  if (this.sortColumn && this.sortDirection) {
    this.data = this.sortData(this.data, this.sortColumn, this.sortDirection);
  }

  // Filter the data based on the search term
  this.displayedData = this.data
    .filter(item => {
      // Combine all columns into a single string for searching
      const rowData = Object.values(item).join('').toLowerCase();
      return rowData.includes(this.searchTerm);
    })
    .slice(startIndex, endIndex);
}

// Function to change the page size
changePageSize(newSize: number) {
  this.pageSize = newSize;
  this.calculateTotalPages();
  this.goToPage(1); // Go to the first page when changing page size
}
  // Function to sort data
  sortData(data: any[], column: string, direction: 'asc' | 'desc'): any[] {
    return data.sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      if (aValue === bValue) {
        return 0;
      }

      if (direction === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });
  }

  // Function to toggle sorting direction
  toggleSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.updateDisplayedData();
  }


// Select or deselect all rows based on the "Select All" checkbox
selectAllRows(event: any) {
  const checked = event.target.checked;
  this.data.forEach(item => {
    item['selected'] = checked;
    if (checked) {
      this.selectedRows.add(item);
    } else {
      this.selectedRows.delete(item);
    }
  });
}


// Check if all rows are selected
areAllRowsSelected() {
  return this.displayedData.every(item => item['selected']);
}


 // Toggle the visibility of the context menu
 showContextMenu(event: MouseEvent, item: any) {
  event.preventDefault();
  item.showContextMenu = !item.showContextMenu;
}
 // Toggle the visibility of the dropdown menu
 toggleContextMenu(item: any) {
  item.showContextMenu = !item.showContextMenu;
}


 // Toggle the visibility of row details
 toggleRowDetail(row: any) {
  if (this.selectedRow === row) {
    // If the clicked row is already selected, deselect it
    this.selectedRow = null;
  } else {
    // If another row is clicked, select it to show details
    this.selectedRow = row;
  }
}

// Check if row details should be visible
isRowDetailVisible(row: any): boolean {
  return this.selectedRow === row;
}

// Function to toggle the selection of a row
toggleRowSelection(item: any) {
  if (this.selectedRows.has(item)) {
    this.selectedRows.delete(item); // If already selected, deselect the row
  } else {
    this.selectedRows.add(item); // If not selected, select the row
  }
}


// Function to check if a row is selected
isRowSelected(item: any): boolean {
  return this.selectedRows.has(item);
}

// Function to count the selected rows
countSelectedRows(): number {
  return this.selectedRows.size;
}


// Handle the Delete action
deleteRecord(item: any) {
  // Implement your delete logic here
  // For example, you can remove the item from the displayedData array
  if (!item.isFrozen) {
  const index = this.displayedData.indexOf(item);
  if (index !== -1) {
    this.displayedData.splice(index, 1);
  }
  // You can also update the data on the server if needed
  console.log('Delete record:', item);
}
}

// Handle the Edit action
editRecord(item: any) {
  // Implement your edit logic here
  // For example, you can open a modal or navigate to an edit page
  console.log('Edit record:', item);
}
searchTerm: string = '';
recentSearches: string[] = [];
highlightedSearch: string = '';
applyFilter(event: KeyboardEvent) {
  const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
  this.searchTerm = filterValue;
  this.updateDisplayedData();

  // Save the recent search when Enter key is pressed
  if (event.key === 'Enter' && filterValue) {
    this.saveRecentSearch(filterValue);
  }
}

saveRecentSearch(search: string) {
  this.recentSearches = this.recentSearches.filter(s => s !== search); // Remove duplicates
  this.recentSearches.unshift(search); // Add the latest search at the beginning of the array
  if (this.recentSearches.length > 5) {
    this.recentSearches = this.recentSearches.slice(0, 5); // Keep only the latest 5 searches
  }
  localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
}

filterBySearch(search: string) {
  this.highlightedSearch = search; 
  if (this.searchTerm !== search) {
    this.searchTerm = search;
    this.updateDisplayedData();
  }
}

deleteRecentSearch(search: string) {
  this.recentSearches = this.recentSearches.filter(s => s !== search);
  localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
}
showRecentSearches: boolean = false;
toggleRecentSearches() {
  this.showRecentSearches = !this.showRecentSearches;
}

// Define filter properties in your component
columnFilters: { [key: string]: string } = {};
// Define isFilterOpen property in your component
isFilterOpen: { [key: string]: boolean } = {};

// Filter the data based on column filters
filterData() {
  this.displayedData = this.data.filter(item => {
      for (const column in this.columnFilters) {
          if (this.columnFilters[column]) {
              const filterValue = this.columnFilters[column].toLowerCase();
              const columnValue = String(item[column]).toLowerCase(); // Convert to string for comparison

              if (!columnValue.includes(filterValue)) {
                  return false;
              }
          }
      }
      return true;
  });
}

toggleColumnFilter(column: string) {
  this.isFilterOpen[column] = !this.isFilterOpen[column];
}

// Add a method to handle filter input blur event
filterInputBlur(column: string) {
  this.isFilterOpen[column] = false;
  this.filterData();
}


// // Function to export data to PDF
exportToPDF() {
  const fileName = 'covid_data.pdf';
  const doc = new jsPDF.default(); // Use jsPDF.default() to construct the document
  const data = this.displayedData.map(item => Object.values(item));
     // Use autoTable from the plugin to create a table in the PDF
     (doc as any).autoTable({
      head: [Object.keys(this.data[0])],
      body: data,
    });
    
    doc.save(fileName);
  }
// Function to export data to CSV
exportToCSV() {
  const fileName = 'covid_data.csv';
  const data = this.convertDataToCSV(this.data);
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);

  // Create a hidden anchor element and trigger a click to download the CSV file
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Helper function to convert data to CSV format
private convertDataToCSV(data: any[]): string {
  const separator = ',';
  const keys = Object.keys(data[0]);

  // Create the header row
  const headerRow = keys.join(separator) + '\n';

  // Create rows for each data item
  const csvRows = data.map(item => {
    const values = keys.map(key => item[key]);
    return values.join(separator);
  });

  // Combine the header row and data rows
  return headerRow + csvRows.join('\n');
}

exportToExcel() {
  const fileName = 'covid_data.xlsx';
  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.data); // Use the full dataset
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, fileName);
}


startEditing(item: any, field: string) {
  if (!item.isFrozen) {
    item['isEditing_' + field] = true;
    item['editValue_' + field] = item[field];
  }
}

saveCell(item: any, field: string) {
  if (!item.isFrozen) {
    item['isEditing_' + field] = false;
    item[field] = item['editValue_' + field];
  }
}

  isFrozen: boolean = false;
toggleFreezeRow(item: any) {
  item.isFrozen = !item.isFrozen;
}


// Add comment to a cell
addComment(row: CountryReports, column: string) {
  const comment = prompt('Enter your comment:');
  if (comment !== null) {
    row['comment'] = comment;
  }
}

// Show comment when hovering over the cell
showComment(row: CountryReports) {
  row['showComment'] = true;
}

// Hide comment when moving away from the cell
hideComment(row: CountryReports) {
  row['showComment'] = false;
}

showSummary: boolean = false;
toggleSummary() {
  this.showSummary = !this.showSummary;
}
  //Data Summaries
  summary: {
    totalCases: number;
    totalDeaths: number;
    totalRecovered: number;
    totalActive: number;
  } = {
      totalCases: 0,
      totalDeaths: 0,
      totalRecovered: 0,
      totalActive: 0
    };
 
  
      calculateSummary(): void {
        const data = this.data;
        this.summary.totalCases = data.reduce((total: any, row: { cases: any; }) => total + row.cases, 0);
        this.summary.totalDeaths = data.reduce((total: any, row: { deaths: any; }) => total + row.deaths, 0);
        this.summary.totalRecovered = data.reduce((total: any, row: { recovered: any; }) => total + row.recovered, 0);
        this.summary.totalActive = data.reduce((total: any, row: { active: any; }) => total + row.active, 0);
      }

    
    
  copySummaryToClipboard() {
    const summaryText = `
      Total Cases: ${this.summary.totalCases}
      Total Deaths: ${this.summary.totalDeaths}
      Total Recovered: ${this.summary.totalRecovered}
      Total Active: ${this.summary.totalActive}
    `;
  
    const textArea = document.createElement('textarea');
    textArea.value = summaryText;
    document.body.appendChild(textArea);
  
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  
    alert('Summary copied to clipboard!');
  }
  
  
// Default colors
defaultColor: string = '#DA70D6';
defaultButtonColor: string = '#000000';
defaultColumnColor: string = '#FFA07A';
defaultGroupColor: string = '#9fb8b1';

// Selected colors
selectedColor: string = this.defaultColor;
selectedButtonColor: string = this.defaultButtonColor;
selectedColumnColor: string = this.defaultColumnColor;
selectedGroupColor: string = this.defaultGroupColor;

applyColors() {
  // Apply the selected colors to the respective variables
  this.defaultColor = this.selectedColor;
  this.defaultButtonColor = this.selectedButtonColor;
  this.defaultColumnColor = this.selectedColumnColor;
  this.defaultGroupColor = this.selectedGroupColor;
}

cancelChanges() {
  // Revert back to the default colors
  this.selectedColor = this.defaultColor;
  this.selectedButtonColor = this.defaultButtonColor;
  this.selectedColumnColor = this.defaultColumnColor;
  this.selectedGroupColor = this.defaultGroupColor;
   // Close the theme submenu card
   this.isThemeSubMenuOpen = false;
}

applyColor(type: string) {
  switch (type) {
    case 'heading':
      this.selectedColor = this.defaultColor;
      break;
    case 'button':
      this.selectedButtonColor = this.defaultButtonColor;
      break;
    case 'column':
      this.selectedColumnColor = this.defaultColumnColor;
      break;
    case 'group':
      this.selectedGroupColor = this.defaultGroupColor;
      break;
    default:
      break;
  }
}
isThemeSubMenuOpen: boolean = false;

openThemeSubMenu() {
  this.isThemeSubMenuOpen = !this.isThemeSubMenuOpen;
}

stopPropagation(event: Event) {
  event.stopPropagation();
}

isContextMenuOpen: boolean = false; // Add this property

openContextMenu() {
  this.isContextMenuOpen = !this.isContextMenuOpen;
}

isFormVisible: boolean = false; // Initialize the form visibility to false

  toggleFormVisibility() {
    this.isFormVisible = !this.isFormVisible; // Toggle the form visibility
  }

// Initialize newRecord with default values
newRecord: any = {
  country: '',
  continent: '',
  cases: 0,
  deaths: 0,
  recovered: 0,
  active: 0,
  casesPerOneMillion: 0,
  deathsPerOneMillion: 0,
  critical: '',
  population: 0,
};

addRecord() {
  // Add the new record to the data array (not the dataSource)
  this.data = [...this.data, this.newRecord];

  // Clear the form and newRecord object
  this.newRecord = {
    country: '',
    continent: '',
    cases: 0,
    deaths: 0,
    recovered: 0,
    active: 0,
    casesPerOneMillion: 0,
    deathsPerOneMillion: 0,
    critical: '',
    population: 0,
  };

  // Update the displayed data and trigger change detection
  this.updateDisplayedData();
}



// Store the dragged item and index
draggedItem: any;
  draggedIndex: number=-1;

  onDragStart(event: DragEvent, index: number) {
    this.draggedItem = this.displayedData[index];
    this.draggedIndex = index;
  }
  
  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    const targetItem = this.displayedData[index];
    if (this.draggedItem !== targetItem) {
      // Swap items in the displayedData array
      this.displayedData[this.draggedIndex] = targetItem;
      this.displayedData[index] = this.draggedItem;
      this.draggedIndex = index;
    }
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
  }
  
  onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    // Update your data array with the new order if needed
    this.data = this.displayedData.slice();
  }
  



}
