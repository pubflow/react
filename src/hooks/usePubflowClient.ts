import { useContext, useMemo } from 'react';
import { BridgePaymentClient } from '@pubflow/core';
import { PubflowContext } from '../context/PubflowProvider';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function withQuery(path: string, params?: QueryParams): string {
  if (!params) return path;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function moduleClient(apiClient: any, prefix: string) {
  const path = (value = '') => `${prefix.replace(/\/$/, '')}${value ? `/${value.replace(/^\//, '')}` : ''}`;
  return {
    get: <T = any>(value = '', params?: QueryParams) => apiClient.get(withQuery(path(value), params)) as Promise<T>,
    post: <T = any>(value: string, body?: any) => apiClient.post(path(value), body) as Promise<T>,
    put: <T = any>(value: string, body?: any) => apiClient.put(path(value), body) as Promise<T>,
    patch: <T = any>(value: string, body?: any) => apiClient.patch(path(value), body) as Promise<T>,
    delete: <T = any>(value: string) => apiClient.delete(path(value)) as Promise<T>,
  };
}

function ultraFormsModules(forms: ReturnType<typeof moduleClient>) {
  return {
    analytics: {
      form: (formId: string, params?: QueryParams) => forms.get(`/analytics/forms/${formId}`, params),
      metrics: (formId: string, params?: QueryParams) => forms.get(`/analytics/forms/${formId}/metrics`, params),
      compute: (formId: string, data: any = {}) => forms.post(`/analytics/forms/${formId}/compute`, data),
    },
    drafts: {
      list: (params?: QueryParams) => forms.get('/drafts', params),
      save: (data: any) => forms.post('/drafts', data),
      stats: (params?: QueryParams) => forms.get('/drafts/stats', params),
      get: (id: string) => forms.get(`/drafts/${id}`),
      update: (id: string, data: any) => forms.put(`/drafts/${id}`, data),
      delete: (id: string) => forms.delete(`/drafts/${id}`),
      convert: (id: string, data: any = {}) => forms.post(`/drafts/${id}/convert`, data),
    },
    webhooks: {
      list: (params?: QueryParams) => forms.get('/webhooks', params),
      create: (data: any) => forms.post('/webhooks', data),
      get: (id: string) => forms.get(`/webhooks/${id}`),
      delete: (id: string) => forms.delete(`/webhooks/${id}`),
      test: (id: string, data: any = {}) => forms.post(`/webhooks/${id}/test`, data),
      logs: (id: string, params?: QueryParams) => forms.get(`/webhooks/${id}/logs`, params),
    },
    workflows: {
      list: (params?: QueryParams) => forms.get('/workflows', params),
      create: (data: any) => forms.post('/workflows', data),
      get: (id: string) => forms.get(`/workflows/${id}`),
      trigger: (id: string, data: any = {}) => forms.post(`/workflows/${id}/trigger`, data),
      history: (id: string, params?: QueryParams) => forms.get(`/workflows/${id}/history`, params),
      execution: (id: string) => forms.get(`/workflow-executions/${id}`),
    },
    assignments: {
      create: (data: any) => forms.post('/assignments', data),
      auto: (data: any) => forms.post('/assignments/auto', data),
      complete: (id: string, data: any = {}) => forms.post(`/assignments/${id}/complete`, data),
    },
    teams: {
      create: (data: any) => forms.post('/teams', data),
      get: (id: string) => forms.get(`/teams/${id}`),
    },
    agents: {
      create: (data: any) => forms.post('/agents', data),
      available: (params?: QueryParams) => forms.get('/agents/available', params),
      workload: (agentId: string, params?: QueryParams) => forms.get(`/agents/${agentId}/workload`, params),
    },
    tickets: {
      list: (params?: QueryParams) => forms.get('/tickets', params),
      create: (data: any) => forms.post('/tickets', data),
      get: (id: string) => forms.get(`/tickets/${id}`),
      update: (id: string, data: any) => forms.put(`/tickets/${id}`, data),
      delete: (id: string) => forms.delete(`/tickets/${id}`),
      status: (id: string, data: any) => forms.patch(`/tickets/${id}/status`, data),
      comments: (id: string, params?: QueryParams) => forms.get(`/tickets/${id}/comments`, params),
      addComment: (id: string, data: any) => forms.post(`/tickets/${id}/comments`, data),
      submission: (submissionId: string) => forms.get(`/tickets/submission/${submissionId}`),
    },
    leads: {
      list: (params?: QueryParams) => forms.get('/leads', params),
      create: (data: any) => forms.post('/leads', data),
      hot: (params?: QueryParams) => forms.get('/leads/hot', params),
      get: (id: string) => forms.get(`/leads/${id}`),
      update: (id: string, data: any) => forms.put(`/leads/${id}`, data),
      delete: (id: string) => forms.delete(`/leads/${id}`),
      qualify: (id: string, data: any = {}) => forms.post(`/leads/${id}/qualify`, data),
      disqualify: (id: string, data: any = {}) => forms.post(`/leads/${id}/disqualify`, data),
      assign: (id: string, data: any) => forms.post(`/leads/${id}/assign`, data),
      recalculate: (id: string, data: any = {}) => forms.post(`/leads/${id}/recalculate`, data),
    },
    forums: {
      boards: (params?: QueryParams) => forms.get('/forums/boards', params),
      threads: (boardId: string, params?: QueryParams) => forms.get(`/forums/boards/${boardId}/threads`, params),
      createThread: (boardId: string, data: any) => forms.post(`/forums/boards/${boardId}/threads`, data),
      getThread: (threadId: string) => forms.get(`/forums/threads/${threadId}`),
      posts: (threadId: string, params?: QueryParams) => forms.get(`/forums/threads/${threadId}/posts`, params),
      createPost: (threadId: string, data: any) => forms.post(`/forums/threads/${threadId}/posts`, data),
      votePost: (postId: string, data: any) => forms.post(`/forums/posts/${postId}/vote`, data),
      moderateThread: (threadId: string, data: any) => forms.post(`/forums/threads/${threadId}/moderate`, data),
      moderatePost: (postId: string, data: any) => forms.post(`/forums/posts/${postId}/moderate`, data),
    },
    lists: {
      subscribe: (slug: string, data: any) => forms.post(`/lists/${slug}/subscribe`, data),
      confirm: (slug: string, token: string) => forms.get(`/lists/${slug}/confirm/${token}`),
      unsubscribe: (slug: string, tokenOrData: string | any) =>
        typeof tokenOrData === 'string' ? forms.get(`/lists/${slug}/unsubscribe/${tokenOrData}`) : forms.post(`/lists/${slug}/unsubscribe`, tokenOrData),
      create: (data: any) => forms.post('/admin/lists', data),
      list: (params?: QueryParams) => forms.get('/admin/lists', params),
      events: (params?: QueryParams) => forms.get('/admin/lists/events', params),
      get: (id: string) => forms.get(`/admin/lists/${id}`),
      update: (id: string, data: any) => forms.put(`/admin/lists/${id}`, data),
      delete: (id: string) => forms.delete(`/admin/lists/${id}`),
      subscribers: (id: string, params?: QueryParams) => forms.get(`/admin/lists/${id}/subscribers`, params),
    },
    modules: {
      status: () => forms.get('/module-install/status'),
      dryRun: (data: any = {}) => forms.post('/module-install/dry-run', data),
      run: (data: any = {}) => forms.post('/module-install/run', data),
      list: (params?: QueryParams) => forms.get('/modules', params),
      moduleStatus: (moduleName: string) => forms.get(`/modules/${moduleName}/status`),
      moduleDryRun: (moduleName: string, data: any = {}) => forms.post(`/modules/${moduleName}/dry-run`, data),
      moduleRun: (moduleName: string, data: any = {}) => forms.post(`/modules/${moduleName}/run`, data),
      registry: (params?: QueryParams) => forms.get('/module-registry', params),
      updateDryRun: (data: any = {}) => forms.post('/module-registry/update/dry-run', data),
      update: (data: any = {}) => forms.post('/module-registry/update', data),
    },
  };
}

export function usePubflowClient(instanceId?: string) {
  const context = useContext(PubflowContext);
  const instance = instanceId || context.defaultInstance;
  const pubflowInstance = context.instances[instance];

  if (!pubflowInstance) {
    throw new Error(`Pubflow instance '${instance}' not found`);
  }

  return useMemo(() => {
    const config = pubflowInstance.config as any;
    const prefixes = config.modulePrefixes || {};
    const forms = moduleClient(pubflowInstance.apiClient, prefixes.forms || '/api/v1');
    const blog = moduleClient(pubflowInstance.apiClient, prefixes.blog || '/api/v1/posts');
    const onboarding = moduleClient(pubflowInstance.apiClient, prefixes.onboarding || '/api/v1/onboarding');
    const payments = new BridgePaymentClient({
      baseUrl: config.paymentsUrl || config.apiUrl || config.baseUrl,
      prefix: prefixes.payments || '/bridge-payment',
      headers: config.headers,
    } as any);

    return {
      config,
      api: pubflowInstance.apiClient,
      payments,
      pay: payments,
      forms: {
        ...forms,
        ...ultraFormsModules(forms),
        listForms: (params?: QueryParams) => forms.get('/forms', params),
        getForm: (id: string) => forms.get(`/forms/${id}`),
        getFormByCode: (code: string) => forms.get(`/forms/by-code/${code}`),
        submitForm: (id: string, data: any) => forms.post(`/forms/${id}/submit`, data),
        submitByCode: (code: string, data: any) => forms.post(`/forms/by-code/${code}/submit`, data),
        saveDraft: (data: any) => forms.post('/drafts', data),
      },
      blog: {
        ...blog,
        listPosts: (params?: QueryParams) => blog.get('', params),
        getPost: (slug: string, params?: QueryParams) => blog.get(`/${slug}`, params),
        getPostById: (id: string) => blog.get(`/id/${id}`),
        createPost: (data: any) => blog.post('', data),
        listCategories: (params?: QueryParams) => blog.get('/categories', params),
        listTags: (params?: QueryParams) => blog.get('/tags', params),
      },
      onboarding: {
        ...onboarding,
        getState: (params?: QueryParams) => onboarding.get('', params),
        start: (data: any = {}) => onboarding.post('/start', data),
        completeStep: (step: string, data: any = {}) => onboarding.post(`/steps/${step}/complete`, data),
        finish: (data: any = {}) => onboarding.post('/complete', data),
      },
    };
  }, [pubflowInstance]);
}

export function useBridgePayments(instanceId?: string) {
  return usePubflowClient(instanceId).payments;
}

export function useUltraForms(instanceId?: string) {
  return usePubflowClient(instanceId).forms;
}

export function useBlog(instanceId?: string) {
  return usePubflowClient(instanceId).blog;
}

export function useOnboarding(instanceId?: string) {
  return usePubflowClient(instanceId).onboarding;
}
