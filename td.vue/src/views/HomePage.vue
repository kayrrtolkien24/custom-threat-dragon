<template>
    <b-container fluid>
        <b-jumbotron id="welcome-jumbotron">
            <b-row class="text-center mb-2">
                <b-col md="12">
                    <h1 class="display-3 text-center">{{ $t("home.title") }}</h1>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="4">
                    <b-img class="td-cupcake"
                           id="home-td-logo"
                           :alt="$t('home.imgAlt')"
                           src="@/assets/kademos_logo.svg"
                    />
                </b-col>
                <b-col md="8">
                    <b-row>
                        <p class="td-description mt-5">
                            {{ $t("home.description") }}
                        </p>
                    </b-row>
                    <b-row>
                        <b-col class="mt-5 ml-5 text-center">
                            <td-provider-login-button
                                v-for="(provider, idx) in providers"
                                :key="idx"
                                :provider="provider"
                            />
                        </b-col>
                    </b-row>
                </b-col>
            </b-row>
            <b-row class="mt-4">
                <b-col class="text-center">
                    <small class="text-muted">
                        Kademos Custom Dragon is based on <a href="https://owasp.org/www-project-threat-dragon/" target="_blank" rel="noopener noreferrer">OWASP Threat Dragon</a>, an open source project under the Apache 2.0 license.
                    </small>
                </b-col>
            </b-row>
        </b-jumbotron>
    </b-container>
</template>

<script>
import { mapState } from 'vuex';

import TdProviderLoginButton from '@/components/ProviderLoginButton.vue';

export default {
    name: 'HomePage',
    components: {
        TdProviderLoginButton
    },
    computed: mapState({
        providers: (state) => state.provider.providers
    })
};
</script>

<style lang="scss" scoped>
.td-cupcake {
    width: 100%;
    max-width: 300px;
    height: auto;
}

.td-description {
    font-size: 1.25rem;
}

#welcome-jumbotron {
    margin-top: 2rem;
    background-color: $background-color;
}
</style>
