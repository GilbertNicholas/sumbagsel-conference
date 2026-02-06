# Contributing Guide

Terima kasih telah tertarik untuk berkontribusi pada project ini!

## Getting Started

1. Fork repository
2. Clone fork Anda: `git clone https://github.com/yourusername/sumbagsel-project.git`
3. Buat branch baru: `git checkout -b feature/your-feature-name`
4. Setup development environment (lihat README.md)

## Development Workflow

1. Buat perubahan di branch Anda
2. Test perubahan Anda
3. Commit dengan pesan yang jelas: `git commit -m "Add feature: description"`
4. Push ke fork Anda: `git push origin feature/your-feature-name`
5. Buat Pull Request

## Code Style

- Gunakan TypeScript untuk type safety
- Ikuti ESLint rules yang sudah dikonfigurasi
- Format code dengan Prettier
- Tulis komentar untuk kode yang kompleks

## Commit Messages

Gunakan format:
```
type: short description

Longer description if needed
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## Pull Request Process

1. Pastikan semua tests pass
2. Update documentation jika perlu
3. Pastikan tidak ada breaking changes (atau dokumentasikan jika ada)
4. Request review dari maintainer
