<script setup lang="ts">
// Test form for FormKit
</script>

<template>
  <div class="p-4 border rounded shadow-md bg-white dark:bg-gray-800">
    <h3 class="text-xl font-bold mb-4">{{ $t('common.info') }}</h3>
    <FormKit type="form" :submit-label="$t('common.submit')">
      <FormKit
        type="text"
        name="name"
        :label="$t('user.username')"
        validation="required"
      />
      <FormKit
        type="email"
        name="email"
        :label="$t('auth.email')"
        validation="required|email"
      />
    </FormKit>
  </div>
</template>
