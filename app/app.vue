<template>
  <div class="min-h-screen bg-gray-50">
    <NuxtRouteAnnouncer />
    
    <!-- Тестовая страница для демонстрации UI компонентов -->
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-8">
        Grand Publicador
      </h1>
      
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <!-- Card с кнопками -->
        <UiCard title="UI Components Demo" variant="elevated">
          <div class="space-y-4">
            <UiButton variant="primary" full-width>
              Primary Button
            </UiButton>
            
            <UiButton variant="secondary" full-width>
              Secondary Button
            </UiButton>
            
            <UiButton variant="ghost" full-width>
              Ghost Button
            </UiButton>
            
            <UiButton variant="danger" full-width>
              Danger Button
            </UiButton>
          </div>
        </UiCard>
        
        <!-- Card с формой -->
        <UiCard title="Form Example" variant="bordered">
          <div class="space-y-4">
            <UiInput
              v-model="testEmail"
              type="email"
              label="Email"
              placeholder="your@email.com"
              required
              hint="Enter your email address"
            />
            
            <UiInput
              v-model="testPassword"
              type="password"
              label="Password"
              placeholder="••••••••"
              required
            />
            
            <UiButton variant="primary" full-width>
              Submit
            </UiButton>
          </div>
        </UiCard>
        
        <!-- Информационная карточка -->
        <UiCard variant="default">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Status</h3>
              <span class="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                Active
              </span>
            </div>
          </template>
          
          <p class="text-gray-600">
            TailwindCSS и Nuxt UI успешно настроены! 🎉
          </p>
          
          <template #footer>
            <div class="flex justify-end space-x-2">
              <UiButton variant="ghost" size="sm">
                Cancel
              </UiButton>
              <UiButton variant="primary" size="sm">
                Confirm
              </UiButton>
            </div>
          </template>
        </UiCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const testEmail = ref('')
const testPassword = ref('')
</script>
