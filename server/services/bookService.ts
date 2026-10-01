import { getStore, updateStore } from '../data/store.js';
import { Book } from '../types.js';

export const bookService = {
  getBooks(query?: { search?: string; subject?: string; applicableClass?: string; publisherId?: string; lowStock?: boolean }): Book[] {
    let books = getStore().books;

    if (!query) return books;

    if (query.search) {
      const q = query.search.toLowerCase();
      books = books.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.subject.toLowerCase().includes(q) ||
          (b.isbn && b.isbn.toLowerCase().includes(q))
      );
    }

    if (query.subject && query.subject !== 'All') {
      books = books.filter((b) => b.subject === query.subject);
    }

    if (query.applicableClass && query.applicableClass !== 'All') {
      books = books.filter((b) => b.applicableClass === query.applicableClass);
    }

    if (query.publisherId && query.publisherId !== 'All') {
      books = books.filter((b) => b.publisherId === query.publisherId);
    }

    if (query.lowStock) {
      books = books.filter((b) => b.currentStock <= b.minStock);
    }

    return books;
  },

  getBookById(id: string): Book | undefined {
    return getStore().books.find((b) => b.id === id);
  },

  createBook(data: Omit<Book, 'id'>): Book {
    const store = getStore();
    const newBook: Book = {
      ...data,
      id: `BK-${100 + store.books.length + 1}`,
    };

    updateStore((prev) => ({
      ...prev,
      books: [...prev.books, newBook],
    }));

    return newBook;
  },

  updateBook(id: string, updates: Partial<Book>): Book {
    let updated: Book | undefined;

    updateStore((prev) => ({
      ...prev,
      books: prev.books.map((b) => {
        if (b.id === id) {
          updated = { ...b, ...updates };
          return updated;
        }
        return b;
      }),
    }));

    if (!updated) {
      throw new Error(`Book with id ${id} not found`);
    }

    return updated;
  },

  deleteBook(id: string): boolean {
    let exists = false;
    updateStore((prev) => {
      exists = prev.books.some((b) => b.id === id);
      return {
        ...prev,
        books: prev.books.filter((b) => b.id !== id),
      };
    });
    return exists;
  },
};
