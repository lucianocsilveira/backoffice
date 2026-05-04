## Regras e Boas Práticas — SEMPRE Seguir

### Angular
- Use **Standalone Components** por padrão (sem NgModules desnecessários)
- Use **Signals** para estado reativo local (`signal()`, `computed()`, `effect()`)
- Implemente **lazy loading** em todas as rotas de features
- Proteja rotas logadas com `AuthGuard` usando `CanActivateFn`
- Use **Resolvers** para pré-carregar dados críticos antes de renderizar
- Tipagem forte em 100% do código — **proibido usar `any`**
- Prefira `inject()` ao invés de injeção via construtor quando estiver em contexto funcional

### Autenticação JWT
- Armazene o token no `localStorage` (ou `sessionStorage` se preferir segurança de sessão)
- Crie um `HttpInterceptor` funcional para anexar o `Authorization: Bearer <token>` em todas as requisições
- Implemente refresh token se o backend suportar
- Redirecione para `/login` automaticamente em erros 401
- A tela de login é pública; todas as demais rotas são protegidas
- **Não há cadastro público** — criação de usuários só ocorre dentro da área logada (por admins)

### Tailwind CSS
- Use classes utilitárias do Tailwind diretamente nos templates
- Crie componentes reutilizáveis para padrões repetitivos (botões, inputs, cards, badges)
- Configure o `tailwind.config.js` com as cores e tipografia do design system do projeto
- Dark mode configurado via classe (`class` strategy) para futura implementação
- Evite `@apply` excessivo — prefira componentização Angular

### Layout e UX
- **Menu lateral fixo** na área logada com:
  - Logo/nome do sistema no topo
  - Links de navegação com ícones (use Heroicons via SVG inline ou biblioteca de ícones)
  - Indicador visual de rota ativa
  - Botão de logout no rodapé
  - Comportamento colapsável em telas menores (responsivo)
- **Header** com informações do usuário logado (nome, avatar/iniciais)
- Layout principal com `sidebar + content area` usando Flexbox/Grid do Tailwind
- Totalmente **responsivo** (mobile-first): sidebar vira drawer em telas `< lg`

### Visual Moderno
- Design limpo, profissional e com alta densidade de informação controlada
- Paleta de cores sóbria e consistente (definir no `tailwind.config.js`)
- Componentes com bordas suaves (`rounded-lg`), sombras sutis e transições fluidas
- Estados de loading com skeletons (não spinners genéricos)
- Feedbacks visuais em todas as ações (toast notifications, estados de erro inline)
- Tabelas de dados com ordenação, paginação e filtros

### Upload de Imagens em Formulários
Sempre que um formulário tiver um campo de imagem/arquivo, seguir este padrão:
- **Nunca** usar `<input type="url">` para imagens — usar `<input type="file" accept="image/jpeg,image/png">`
- Aceitar apenas **JPG e PNG** — validar o `file.type` via `isFileTypeValid(file)` do utilitário `file-validation.utils.ts` antes de validar o tamanho
- Enviar como `multipart/form-data` via `FormData` (não JSON)
- O service recebe `FormData` e retorna a entidade com `imageUrl` já preenchida pelo backend
- No componente, usar signals: `selectedFile = signal<File | null>(null)`, `previewUrl = signal<string | null>(null)`, `isDragOver = signal(false)`
- Gerar preview com `URL.createObjectURL(file)` e revogar no `ngOnDestroy` com `URL.revokeObjectURL`
- Em modo edição: campo de arquivo é opcional — exibir imagem atual e só enviar `image` no FormData se novo arquivo selecionado
- Validação manual: se modo criação e nenhum arquivo selecionado, bloquear submit e exibir erro via signal (`imageRequired = signal(false)`)
- A área de upload deve ser um `<label>` estilizado com `border-dashed` do Tailwind, exibindo nome do arquivo quando selecionado
- **Drag-and-drop obrigatório:** o `<label>` deve responder a `(dragover)`, `(dragleave)` e `(drop)`. Ao arrastar sobre a área, mudar o estilo visualmente (ex: borda e fundo em `primary`). O arquivo arrastado deve ser processado exatamente como o selecionado via clique. Extrair um método privado `processFile(file, inputRef?)` para evitar duplicação entre `onFileChange` e `onDrop`.

```typescript
// Exemplo no component
readonly selectedFile = signal<File | null>(null);
readonly previewUrl = signal<string | null>(null);
readonly isDragOver = signal(false);
private objectUrl: string | null = null;

onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  this.processFile(file, input);
}

onDragOver(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
  this.isDragOver.set(true);
}

onDragLeave(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
  this.isDragOver.set(false);
}

onDrop(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
  this.isDragOver.set(false);
  const file = event.dataTransfer?.files?.[0] ?? null;
  this.processFile(file);
}

private processFile(file: File | null, inputRef?: HTMLInputElement): void {
  this.imageRequired.set(false);
  this.imageSizeError.set(false);
  if (this.objectUrl) { URL.revokeObjectURL(this.objectUrl); this.objectUrl = null; }
  if (file && !isFileSizeValid(file)) {
    this.imageSizeError.set(true);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    if (inputRef) inputRef.value = '';
    return;
  }
  this.selectedFile.set(file);
  this.objectUrl = file ? URL.createObjectURL(file) : null;
  this.previewUrl.set(this.objectUrl);
}

ngOnDestroy(): void {
  if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
}

// No submit:
const fd = new FormData();
fd.append('slug', this.form.controls.slug.value);
if (this.selectedFile()) fd.append('image', this.selectedFile()!);
```

```html
<!-- Template: área de upload com drag-and-drop -->
<label
  class="flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors"
  [class]="imageRequired() ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : isDragOver() ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700'"
  (dragover)="onDragOver($event)"
  (dragleave)="onDragLeave($event)"
  (drop)="onDrop($event)"
>
  <!-- conteúdo: ícone, nome do arquivo, texto de instrução -->
  @if (isDragOver()) {
    <p>{{ 'form.imageDrop' | transloco }}</p>
  } @else if (selectedFile()) {
    <p>{{ selectedFile()!.name }}</p>
  } @else {
    <p>{{ 'form.imageSelect' | transloco }}</p>
  }
  <input type="file" accept="image/*" class="hidden" (change)="onFileChange($event)" />
</label>
```

---

### Integração com Backend .NET
- Crie um `service` por domínio (ex: `UsersService`, `OrdersService`)
- Defina interfaces TypeScript espelhando os DTOs do backend
- Trate erros HTTP de forma centralizada
- Use `environment.ts` para a URL base da API
- Implemente loading states e error states em todos os componentes que fazem chamadas HTTP

### Qualidade de Código
- Siga o **Angular Style Guide** oficial
- Nomes em inglês para código, português apenas para textos da interface
- Componentes com responsabilidade única (SRP)
- Evite lógica nos templates — mova para o componente ou services
- Escreva código legível — prefira clareza à esperteza

---

## Comportamento Esperado do Copilot

1. **Ao gerar componentes:** sempre use standalone, com `imports` explícitos, tipagem forte e Tailwind para estilos
2. **Ao gerar services:** sempre injete com `providedIn: 'root'`, retorne `Observable` tipado do HttpClient
3. **Ao gerar rotas:** sempre aplique lazy loading e guards nas rotas protegidas
4. **Ao sugerir estilos:** use classes Tailwind, não CSS inline ou style blocks
5. **Ao criar formulários:** use **Reactive Forms** com validações tipadas
6. **Ao tratar erros:** sempre implemente `catchError` nos observables de HTTP
7. **Proibido:** `any`, `NgModules` desnecessários, CSS global sem necessidade, lógica complexa em templates
8. **Ao criar qualquer página/componente:** deve ser totalmente **responsivo** (mobile-first com classes Tailwind) e todas as strings de texto visíveis ao usuário devem usar o pipe `| transloco` com chaves nos arquivos `public/assets/i18n/*.json` (pt-BR, en, es) e deve seguir o tema selecionado (claro/escuro) usando as classes do Tailwind configuradas no `tailwind.config.js` para cores, tipografia e espaçamento.

---

## Exemplo de Padrão de Rota Esperado

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes') },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
```

---

Siga estas diretrizes em **todas** as sugestões de código. Quando houver ambiguidade, priorize: **segurança > manutenibilidade > performance > brevidade**.
