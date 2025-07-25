<template>
  <b-navbar toggleable="lg" fixed="top" id="navbar">
    <b-navbar-brand :to="username ? '/dashboard' : '/'" class="td-brand">
      <b-img src="@/assets/kademos_logo_simple.svg" class="td-brand-img" alt="Kademos Custom Dragon Logo" />
      Kademos Custom Dragon v{{this.$store.state.packageBuildVersion}}{{this.$store.state.packageBuildState}}
    </b-navbar-brand>

    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav>
        <b-nav-item>
            <td-locale-select />
        </b-nav-item>
      </b-navbar-nav>
      
      <b-navbar-nav class="ml-auto">
        <b-nav-text v-show="username" class="logged-in-as">{{ $t('nav.loggedInAs')}} {{ username }}</b-nav-text>
        <b-nav-item v-show="username" @click="onLogOut" id="nav-sign-out">
          <font-awesome-icon
            icon="sign-out-alt"
            class="td-fa-nav"
            v-b-tooltip.hover :title="$t('nav.logOut')"
          ></font-awesome-icon>
        </b-nav-item>
        <b-nav-item
          href="https://github.com/kayrrtolkien24/custom-threat-dragon/blob/main/CUSTOM_FEATURES.md"
          target="_blank"
          rel="noopener noreferrer"
          id="nav-docs"
        >
          <font-awesome-icon
            icon="book"
            class="td-fa-nav"
            v-b-tooltip.hover :title="$t('nav.documentation')"
          ></font-awesome-icon>
        </b-nav-item>
        <b-nav-item
          href="https://owasp.org/www-project-threat-dragon/"
          target="_blank"
          rel="noopener noreferrer"
          id="nav-attribution"
          v-b-tooltip.hover
          title="Based on OWASP Threat Dragon"
        >
          <font-awesome-icon
            icon="code-branch"
            class="td-fa-nav"
          ></font-awesome-icon>
        </b-nav-item>
        <b-nav-item
          href="https://github.com/kayrrtolkien24/custom-threat-dragon/issues"
          target="_blank"
          rel="noopener noreferrer"
          id="nav-issues"
        >
          <font-awesome-icon
            icon="bug"
            class="td-fa-nav"
            v-b-tooltip.hover :title="$t('nav.issues')"
          ></font-awesome-icon>
        </b-nav-item>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>

<script>
import { mapGetters } from 'vuex';

import TdLocaleSelect from './LocaleSelect.vue';
import authActions from '@/store/actions/auth.js';

export default {
  name: 'TdNavbar',
  components: {
    TdLocaleSelect
  },
  computed: {
    ...mapGetters(['username'])
  },
  methods: {
    onLogOut() {
      this.$store.dispatch(authActions.logout);
    }
  }
};
</script>

<style lang="scss" scoped>
.td-brand {
  display: flex;
  align-items: center;
  color: $primary-color;
  font-weight: bold;
  font-size: 1.1rem;
}

.td-brand-img {
  max-height: 2rem;
  margin-right: 0.5rem;
}

.td-fa-nav {
  font-size: 1.5rem;
}

.logged-in-as {
  padding: 0.5rem 1rem;
}
</style>
