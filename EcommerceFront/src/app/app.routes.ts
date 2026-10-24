import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { HomeComponent } from './features/home/home';
import { CartComponent } from './features/cart/cart';
import { ProductDetailComponent } from './features/product/product-detail';
import { CatalogComponent } from './features/catalog/catalog';
import { AboutUsComponent } from './features/info/about_us/about_us';
import { HowToBuyComponent } from './features/info/how_to_buy/how_to_buy';
import { PickupReturnsComponent } from './features/info/pickup_returns/pickup_returns';
import { FaqComponent } from './features/info/faq/faq';
import { CareersComponent } from './features/info/careers/careers';
import { CheckoutComponent } from './features/checkout/checkout';
import { OrderConfirmationComponent } from './features/order_confirmation/order_confirmation';
import { RegisterComponent } from './features/auth/register/register';

// No olvides importar el guardián que acabamos de crear
import { authGuard } from './core/guards/auth.guard';
import { ProductFormComponent } from './features/admin/product_form/product_form';
import { adminGuard } from './core/guards/admin-guard';
import { LayoutComponent } from './features/admin/layout/layout';
import { ReportsComponent } from './features/admin/reports/reports';
import { SalesComponent } from './features/admin/sales/sales';
import { CustomersComponent } from './features/admin/customers/customers';
import { CategoriesComponent } from './features/admin/categories/categories';
import { InventoryComponent } from './features/admin/inventory/inventory';
import { PosComponent } from './features/admin/pos/pos';
import { OrdersComponent } from './features/admin/orders/orders';
import { MyOrdersComponent } from './features/my-orders/my-orders';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },

  // Rutas Públicas (Cualquiera puede verlas, sin estar logueado)
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'catalog',
    component: CatalogComponent,
  },
  {
    path: 'product/:id',
    component: ProductDetailComponent,
  },
  {
    path: 'about_us',
    component: AboutUsComponent,
  },
  {
    path: 'how_to_buy',
    component: HowToBuyComponent,
  },
  {
    path: 'pickup_returns',
    component: PickupReturnsComponent,
  },
  {
    path: 'faq',
    component: FaqComponent,
  },
  {
    path: 'careers',
    component: CareersComponent,
  },

  // Rutas Privadas (Protegidas por el Guardián)
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [authGuard], // <--- ¡El vigilante en la puerta!
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard],
  },
  {
    path: 'order-confirmation',
    component: OrderConfirmationComponent,
    canActivate: [authGuard],
  },
  // Rutas Privadas (Protegidas por el Guardián)
  {
    path: 'mis-compras',
    component: MyOrdersComponent,
    canActivate: [authGuard],
  },
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [authGuard],
  },
  // ... resto de tus rutas
  // 2. AGREGA LA RUTA DEL ADMINISTRADOR▬
  {
    path: 'admin',
    canActivate: [adminGuard],
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      { path: 'orders', component: OrdersComponent },
      { path: 'pos', component: PosComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'inventory/new', component: ProductFormComponent },
      { path: 'inventory/edit/:id', component: ProductFormComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'sales', component: SalesComponent },
      { path: 'reports', component: ReportsComponent },
    ],
  },

  { path: '**', redirectTo: 'home' },
];
