--
-- PostgreSQL database dump
--

\restrict 5ts4EedSPhXHhIX3yrANMgaBC9JKVMGSYMerSv0NlSkWVkLxfgViSISJarEbBTq

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_bespoke_request; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.app_bespoke_request (
    id integer NOT NULL,
    reference character varying(64) NOT NULL,
    customername character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(64) DEFAULT NULL::character varying,
    pieces integer NOT NULL,
    budget double precision NOT NULL,
    deadline date,
    description text NOT NULL,
    images json NOT NULL,
    status character varying(32) NOT NULL,
    quoteamount double precision,
    stripepaymentlink character varying(1024) DEFAULT NULL::character varying,
    adminnotes text,
    createdat timestamp(0) without time zone NOT NULL,
    updatedat timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.app_bespoke_request OWNER TO sylius;

--
-- Name: COLUMN app_bespoke_request.createdat; Type: COMMENT; Schema: public; Owner: sylius
--

COMMENT ON COLUMN public.app_bespoke_request.createdat IS '(DC2Type:datetime_immutable)';


--
-- Name: COLUMN app_bespoke_request.updatedat; Type: COMMENT; Schema: public; Owner: sylius
--

COMMENT ON COLUMN public.app_bespoke_request.updatedat IS '(DC2Type:datetime_immutable)';


--
-- Name: app_tip; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.app_tip (
    id integer NOT NULL,
    code character varying(64),
    subject character varying(255) NOT NULL,
    content text NOT NULL,
    category character varying(64) NOT NULL,
    sentdate character varying(32) NOT NULL,
    enabled boolean NOT NULL,
    "position" integer NOT NULL,
    createdat timestamp(0) without time zone NOT NULL,
    updatedat timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    subtitle character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.app_tip OWNER TO sylius;

--
-- Name: COLUMN app_tip.createdat; Type: COMMENT; Schema: public; Owner: sylius
--

COMMENT ON COLUMN public.app_tip.createdat IS '(DC2Type:datetime_immutable)';


--
-- Name: COLUMN app_tip.updatedat; Type: COMMENT; Schema: public; Owner: sylius
--

COMMENT ON COLUMN public.app_tip.updatedat IS '(DC2Type:datetime_immutable)';


--
-- Name: sylius_address; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_address (
    id integer NOT NULL,
    customer_id integer,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    phone_number character varying(255) DEFAULT NULL::character varying,
    street character varying(255) NOT NULL,
    company character varying(255) DEFAULT NULL::character varying,
    city character varying(255) NOT NULL,
    postcode character varying(255) NOT NULL,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    country_code character varying(255) NOT NULL,
    province_code character varying(255) DEFAULT NULL::character varying,
    province_name character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.sylius_address OWNER TO sylius;

--
-- Name: sylius_admin_user; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_admin_user (
    id integer NOT NULL,
    username character varying(255) DEFAULT NULL::character varying,
    username_canonical character varying(255) DEFAULT NULL::character varying,
    enabled boolean NOT NULL,
    password character varying(255) DEFAULT NULL::character varying,
    last_login timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    password_reset_token character varying(255) DEFAULT NULL::character varying,
    password_requested_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    email_verification_token character varying(255) DEFAULT NULL::character varying,
    verified_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    roles jsonb NOT NULL,
    email character varying(255) DEFAULT NULL::character varying,
    email_canonical character varying(255) DEFAULT NULL::character varying,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    first_name character varying(255) DEFAULT NULL::character varying,
    last_name character varying(255) DEFAULT NULL::character varying,
    locale_code character varying(12) NOT NULL,
    mollie_onboarding_completed boolean DEFAULT false NOT NULL
);


ALTER TABLE public.sylius_admin_user OWNER TO sylius;

--
-- Name: sylius_channel_pricing; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_channel_pricing (
    id integer NOT NULL,
    product_variant_id integer NOT NULL,
    price integer,
    original_price integer,
    minimum_price integer DEFAULT 0,
    lowest_price_before_discount integer,
    channel_code character varying(255) NOT NULL
);


ALTER TABLE public.sylius_channel_pricing OWNER TO sylius;

--
-- Name: sylius_customer; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_customer (
    id integer NOT NULL,
    customer_group_id integer,
    default_address_id integer,
    email character varying(255) NOT NULL,
    email_canonical character varying(255) NOT NULL,
    first_name character varying(255) DEFAULT NULL::character varying,
    last_name character varying(255) DEFAULT NULL::character varying,
    birthday timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    gender character varying(1) DEFAULT 'u'::character varying NOT NULL,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    phone_number character varying(255) DEFAULT NULL::character varying,
    subscribed_to_newsletter boolean NOT NULL
);


ALTER TABLE public.sylius_customer OWNER TO sylius;

--
-- Name: sylius_gateway_config; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_gateway_config (
    id integer NOT NULL,
    gateway_name character varying(255) NOT NULL,
    factory_name character varying(255) NOT NULL,
    config json NOT NULL,
    use_payum boolean DEFAULT true NOT NULL
);


ALTER TABLE public.sylius_gateway_config OWNER TO sylius;

--
-- Name: sylius_order; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_order (
    id integer NOT NULL,
    shipping_address_id integer,
    billing_address_id integer,
    channel_id integer,
    promotion_coupon_id integer,
    customer_id integer,
    number character varying(255) DEFAULT NULL::character varying,
    notes text,
    state character varying(255) NOT NULL,
    checkout_completed_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    items_total integer NOT NULL,
    adjustments_total integer NOT NULL,
    total integer NOT NULL,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    currency_code character varying(3) NOT NULL,
    locale_code character varying(255) NOT NULL,
    checkout_state character varying(255) NOT NULL,
    payment_state character varying(255) NOT NULL,
    shipping_state character varying(255) NOT NULL,
    created_by_guest boolean DEFAULT true NOT NULL,
    token_value character varying(255) DEFAULT NULL::character varying,
    customer_ip character varying(255) DEFAULT NULL::character varying,
    abandoned_email boolean NOT NULL,
    recurring_sequence_index integer,
    qr_code text,
    mollie_payment_id text
);


ALTER TABLE public.sylius_order OWNER TO sylius;

--
-- Name: sylius_order_item; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_order_item (
    id integer NOT NULL,
    order_id integer NOT NULL,
    variant_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price integer NOT NULL,
    original_unit_price integer,
    units_total integer NOT NULL,
    adjustments_total integer NOT NULL,
    total integer NOT NULL,
    is_immutable boolean NOT NULL,
    product_name character varying(255) DEFAULT NULL::character varying,
    variant_name character varying(255) DEFAULT NULL::character varying,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.sylius_order_item OWNER TO sylius;

--
-- Name: sylius_order_item_unit; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_order_item_unit (
    id integer NOT NULL,
    order_item_id integer NOT NULL,
    shipment_id integer,
    adjustments_total integer NOT NULL,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.sylius_order_item_unit OWNER TO sylius;

--
-- Name: sylius_payment; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_payment (
    id integer NOT NULL,
    method_id integer,
    order_id integer NOT NULL,
    currency_code character varying(3) NOT NULL,
    amount integer NOT NULL,
    state character varying(255) NOT NULL,
    details json NOT NULL,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.sylius_payment OWNER TO sylius;

--
-- Name: sylius_payment_method; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_payment_method (
    id integer NOT NULL,
    gateway_config_id integer,
    code character varying(255) NOT NULL,
    environment character varying(255) DEFAULT NULL::character varying,
    is_enabled boolean NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.sylius_payment_method OWNER TO sylius;

--
-- Name: sylius_product; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_product (
    id integer NOT NULL,
    main_taxon_id integer,
    code character varying(255) NOT NULL,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    enabled boolean NOT NULL,
    variant_selection_method character varying(255) NOT NULL,
    average_rating double precision DEFAULT '0'::double precision NOT NULL,
    product_type_id integer
);


ALTER TABLE public.sylius_product OWNER TO sylius;

--
-- Name: sylius_product_image; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_product_image (
    id integer NOT NULL,
    owner_id integer NOT NULL,
    type character varying(255) DEFAULT NULL::character varying,
    path character varying(255) NOT NULL,
    "position" integer NOT NULL
);


ALTER TABLE public.sylius_product_image OWNER TO sylius;

--
-- Name: sylius_product_taxon; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_product_taxon (
    id integer NOT NULL,
    product_id integer NOT NULL,
    taxon_id integer NOT NULL,
    "position" integer NOT NULL
);


ALTER TABLE public.sylius_product_taxon OWNER TO sylius;

--
-- Name: sylius_product_translation; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_product_translation (
    id integer NOT NULL,
    translatable_id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    meta_keywords character varying(255) DEFAULT NULL::character varying,
    meta_description character varying(255) DEFAULT NULL::character varying,
    short_description text,
    locale character varying(255) NOT NULL
);


ALTER TABLE public.sylius_product_translation OWNER TO sylius;

--
-- Name: sylius_product_variant; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_product_variant (
    id integer NOT NULL,
    product_id integer NOT NULL,
    tax_category_id integer,
    shipping_category_id integer,
    code character varying(255) NOT NULL,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    "position" integer NOT NULL,
    enabled boolean NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    on_hold integer NOT NULL,
    on_hand integer NOT NULL,
    tracked boolean NOT NULL,
    width double precision,
    height double precision,
    depth double precision,
    weight double precision,
    shipping_required boolean NOT NULL,
    commodity_code character varying(12) DEFAULT NULL::character varying,
    recurring boolean DEFAULT false NOT NULL,
    recurring_times integer,
    recurring_interval character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.sylius_product_variant OWNER TO sylius;

--
-- Name: sylius_shop_user; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_shop_user (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    username character varying(255) DEFAULT NULL::character varying,
    username_canonical character varying(255) DEFAULT NULL::character varying,
    enabled boolean NOT NULL,
    password character varying(255) DEFAULT NULL::character varying,
    last_login timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    password_reset_token character varying(255) DEFAULT NULL::character varying,
    password_requested_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    email_verification_token character varying(255) DEFAULT NULL::character varying,
    verified_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone,
    roles jsonb NOT NULL,
    email character varying(255) DEFAULT NULL::character varying,
    email_canonical character varying(255) DEFAULT NULL::character varying,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.sylius_shop_user OWNER TO sylius;

--
-- Name: sylius_taxon; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_taxon (
    id integer NOT NULL,
    tree_root integer,
    parent_id integer,
    code character varying(255) NOT NULL,
    tree_left integer NOT NULL,
    tree_right integer NOT NULL,
    tree_level integer NOT NULL,
    "position" integer NOT NULL,
    enabled boolean NOT NULL,
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone DEFAULT NULL::timestamp without time zone
);


ALTER TABLE public.sylius_taxon OWNER TO sylius;

--
-- Name: sylius_taxon_translation; Type: TABLE; Schema: public; Owner: sylius
--

CREATE TABLE public.sylius_taxon_translation (
    id integer NOT NULL,
    translatable_id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    locale character varying(255) NOT NULL
);


ALTER TABLE public.sylius_taxon_translation OWNER TO sylius;

--
-- Name: app_bespoke_request app_bespoke_request_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.app_bespoke_request
    ADD CONSTRAINT app_bespoke_request_pkey PRIMARY KEY (id);


--
-- Name: app_tip app_tip_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.app_tip
    ADD CONSTRAINT app_tip_pkey PRIMARY KEY (id);


--
-- Name: sylius_address sylius_address_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_address
    ADD CONSTRAINT sylius_address_pkey PRIMARY KEY (id);


--
-- Name: sylius_admin_user sylius_admin_user_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_admin_user
    ADD CONSTRAINT sylius_admin_user_pkey PRIMARY KEY (id);


--
-- Name: sylius_channel_pricing sylius_channel_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_channel_pricing
    ADD CONSTRAINT sylius_channel_pricing_pkey PRIMARY KEY (id);


--
-- Name: sylius_customer sylius_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_customer
    ADD CONSTRAINT sylius_customer_pkey PRIMARY KEY (id);


--
-- Name: sylius_gateway_config sylius_gateway_config_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_gateway_config
    ADD CONSTRAINT sylius_gateway_config_pkey PRIMARY KEY (id);


--
-- Name: sylius_order_item sylius_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order_item
    ADD CONSTRAINT sylius_order_item_pkey PRIMARY KEY (id);


--
-- Name: sylius_order_item_unit sylius_order_item_unit_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order_item_unit
    ADD CONSTRAINT sylius_order_item_unit_pkey PRIMARY KEY (id);


--
-- Name: sylius_order sylius_order_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order
    ADD CONSTRAINT sylius_order_pkey PRIMARY KEY (id);


--
-- Name: sylius_payment_method sylius_payment_method_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_payment_method
    ADD CONSTRAINT sylius_payment_method_pkey PRIMARY KEY (id);


--
-- Name: sylius_payment sylius_payment_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_payment
    ADD CONSTRAINT sylius_payment_pkey PRIMARY KEY (id);


--
-- Name: sylius_product_image sylius_product_image_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_image
    ADD CONSTRAINT sylius_product_image_pkey PRIMARY KEY (id);


--
-- Name: sylius_product sylius_product_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product
    ADD CONSTRAINT sylius_product_pkey PRIMARY KEY (id);


--
-- Name: sylius_product_taxon sylius_product_taxon_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_taxon
    ADD CONSTRAINT sylius_product_taxon_pkey PRIMARY KEY (id);


--
-- Name: sylius_product_translation sylius_product_translation_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_translation
    ADD CONSTRAINT sylius_product_translation_pkey PRIMARY KEY (id);


--
-- Name: sylius_product_variant sylius_product_variant_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_variant
    ADD CONSTRAINT sylius_product_variant_pkey PRIMARY KEY (id);


--
-- Name: sylius_shop_user sylius_shop_user_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_shop_user
    ADD CONSTRAINT sylius_shop_user_pkey PRIMARY KEY (id);


--
-- Name: sylius_taxon sylius_taxon_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_taxon
    ADD CONSTRAINT sylius_taxon_pkey PRIMARY KEY (id);


--
-- Name: sylius_taxon_translation sylius_taxon_translation_pkey; Type: CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_taxon_translation
    ADD CONSTRAINT sylius_taxon_translation_pkey PRIMARY KEY (id);


--
-- Name: created_at_index; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX created_at_index ON public.sylius_customer USING btree (created_at);


--
-- Name: idx_105a9082c2ac5d3; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_105a9082c2ac5d3 ON public.sylius_product_translation USING btree (translatable_id);


--
-- Name: idx_1487dfcf2c2ac5d3; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_1487dfcf2c2ac5d3 ON public.sylius_taxon_translation USING btree (translatable_id);


--
-- Name: idx_169c6cd94584665a; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_169c6cd94584665a ON public.sylius_product_taxon USING btree (product_id);


--
-- Name: idx_169c6cd9de13f470; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_169c6cd9de13f470 ON public.sylius_product_taxon USING btree (taxon_id);


--
-- Name: idx_6196a1f917b24436; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_6196a1f917b24436 ON public.sylius_order USING btree (promotion_coupon_id);


--
-- Name: idx_6196a1f972f5a1aa; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_6196a1f972f5a1aa ON public.sylius_order USING btree (channel_id);


--
-- Name: idx_6196a1f99395c3f3; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_6196a1f99395c3f3 ON public.sylius_order USING btree (customer_id);


--
-- Name: idx_6196a1f9a393d2fb43625d9f; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_6196a1f9a393d2fb43625d9f ON public.sylius_order USING btree (state, updated_at);


--
-- Name: idx_677b9b7414959723; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_677b9b7414959723 ON public.sylius_product USING btree (product_type_id);


--
-- Name: idx_677b9b74731e505; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_677b9b74731e505 ON public.sylius_product USING btree (main_taxon_id);


--
-- Name: idx_77b587ed3b69a9af; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_77b587ed3b69a9af ON public.sylius_order_item USING btree (variant_id);


--
-- Name: idx_77b587ed8d9f6d38; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_77b587ed8d9f6d38 ON public.sylius_order_item USING btree (order_id);


--
-- Name: idx_7801820ca80ef684; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_7801820ca80ef684 ON public.sylius_channel_pricing USING btree (product_variant_id);


--
-- Name: idx_7e82d5e6d2919a68; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_7e82d5e6d2919a68 ON public.sylius_customer USING btree (customer_group_id);


--
-- Name: idx_82bf226e7be036fc; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_82bf226e7be036fc ON public.sylius_order_item_unit USING btree (shipment_id);


--
-- Name: idx_82bf226ee415fb15; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_82bf226ee415fb15 ON public.sylius_order_item_unit USING btree (order_item_id);


--
-- Name: idx_88c64b2d7e3c61f9; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_88c64b2d7e3c61f9 ON public.sylius_product_image USING btree (owner_id);


--
-- Name: idx_a29b5234584665a; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_a29b5234584665a ON public.sylius_product_variant USING btree (product_id);


--
-- Name: idx_a29b5239df894ed; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_a29b5239df894ed ON public.sylius_product_variant USING btree (tax_category_id);


--
-- Name: idx_a29b5239e2d1a41; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_a29b5239e2d1a41 ON public.sylius_product_variant USING btree (shipping_category_id);


--
-- Name: idx_a75b0b0df23d6140; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_a75b0b0df23d6140 ON public.sylius_payment_method USING btree (gateway_config_id);


--
-- Name: idx_b97ff0589395c3f3; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_b97ff0589395c3f3 ON public.sylius_address USING btree (customer_id);


--
-- Name: idx_cfd811ca727aca70; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_cfd811ca727aca70 ON public.sylius_taxon USING btree (parent_id);


--
-- Name: idx_cfd811caa977936c; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_cfd811caa977936c ON public.sylius_taxon USING btree (tree_root);


--
-- Name: idx_d9191bd419883967; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_d9191bd419883967 ON public.sylius_payment USING btree (method_id);


--
-- Name: idx_d9191bd48d9f6d38; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_d9191bd48d9f6d38 ON public.sylius_payment USING btree (order_id);


--
-- Name: idx_telemetry_order_stats; Type: INDEX; Schema: public; Owner: sylius
--

CREATE INDEX idx_telemetry_order_stats ON public.sylius_order USING btree (checkout_completed_at, checkout_state, payment_state);


--
-- Name: product_taxon_idx; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX product_taxon_idx ON public.sylius_product_taxon USING btree (product_id, taxon_id);


--
-- Name: product_variant_channel_idx; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX product_variant_channel_idx ON public.sylius_channel_pricing USING btree (product_variant_id, channel_code);


--
-- Name: slug_uidx; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX slug_uidx ON public.sylius_taxon_translation USING btree (locale, slug);


--
-- Name: sylius_product_translation_uniq_trans; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX sylius_product_translation_uniq_trans ON public.sylius_product_translation USING btree (translatable_id, locale);


--
-- Name: sylius_taxon_translation_uniq_trans; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX sylius_taxon_translation_uniq_trans ON public.sylius_taxon_translation USING btree (translatable_id, locale);


--
-- Name: uniq_105a9084180c698989d9b62; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_105a9084180c698989d9b62 ON public.sylius_product_translation USING btree (locale, slug);


--
-- Name: uniq_6196a1f94d4cff2b; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_6196a1f94d4cff2b ON public.sylius_order USING btree (shipping_address_id);


--
-- Name: uniq_6196a1f979d0c0e4; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_6196a1f979d0c0e4 ON public.sylius_order USING btree (billing_address_id);


--
-- Name: uniq_6196a1f996901f54; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_6196a1f996901f54 ON public.sylius_order USING btree (number);


--
-- Name: uniq_6196a1f9bea95c75; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_6196a1f9bea95c75 ON public.sylius_order USING btree (token_value);


--
-- Name: uniq_66f10b8b77153098; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_66f10b8b77153098 ON public.app_tip USING btree (code);


--
-- Name: uniq_677b9b7477153098; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_677b9b7477153098 ON public.sylius_product USING btree (code);


--
-- Name: uniq_7c2b74806b7ba4b6; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_7c2b74806b7ba4b6 ON public.sylius_shop_user USING btree (password_reset_token);


--
-- Name: uniq_7c2b74809395c3f3; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_7c2b74809395c3f3 ON public.sylius_shop_user USING btree (customer_id);


--
-- Name: uniq_7c2b7480c4995c67; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_7c2b7480c4995c67 ON public.sylius_shop_user USING btree (email_verification_token);


--
-- Name: uniq_7e82d5e6a0d96fbf; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_7e82d5e6a0d96fbf ON public.sylius_customer USING btree (email_canonical);


--
-- Name: uniq_7e82d5e6bd94fb16; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_7e82d5e6bd94fb16 ON public.sylius_customer USING btree (default_address_id);


--
-- Name: uniq_7e82d5e6e7927c74; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_7e82d5e6e7927c74 ON public.sylius_customer USING btree (email);


--
-- Name: uniq_88d5cc4d6b7ba4b6; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_88d5cc4d6b7ba4b6 ON public.sylius_admin_user USING btree (password_reset_token);


--
-- Name: uniq_88d5cc4dc4995c67; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_88d5cc4dc4995c67 ON public.sylius_admin_user USING btree (email_verification_token);


--
-- Name: uniq_9a994affaea34913; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_9a994affaea34913 ON public.app_bespoke_request USING btree (reference);


--
-- Name: uniq_a29b52377153098; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_a29b52377153098 ON public.sylius_product_variant USING btree (code);


--
-- Name: uniq_a75b0b0d77153098; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_a75b0b0d77153098 ON public.sylius_payment_method USING btree (code);


--
-- Name: uniq_cfd811ca77153098; Type: INDEX; Schema: public; Owner: sylius
--

CREATE UNIQUE INDEX uniq_cfd811ca77153098 ON public.sylius_taxon USING btree (code);


--
-- Name: sylius_product_translation fk_105a9082c2ac5d3; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_translation
    ADD CONSTRAINT fk_105a9082c2ac5d3 FOREIGN KEY (translatable_id) REFERENCES public.sylius_product(id) ON DELETE CASCADE;


--
-- Name: sylius_taxon_translation fk_1487dfcf2c2ac5d3; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_taxon_translation
    ADD CONSTRAINT fk_1487dfcf2c2ac5d3 FOREIGN KEY (translatable_id) REFERENCES public.sylius_taxon(id) ON DELETE CASCADE;


--
-- Name: sylius_product_taxon fk_169c6cd94584665a; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_taxon
    ADD CONSTRAINT fk_169c6cd94584665a FOREIGN KEY (product_id) REFERENCES public.sylius_product(id) ON DELETE CASCADE;


--
-- Name: sylius_product_taxon fk_169c6cd9de13f470; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_taxon
    ADD CONSTRAINT fk_169c6cd9de13f470 FOREIGN KEY (taxon_id) REFERENCES public.sylius_taxon(id) ON DELETE CASCADE;


--
-- Name: sylius_order fk_6196a1f917b24436; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order
    ADD CONSTRAINT fk_6196a1f917b24436 FOREIGN KEY (promotion_coupon_id) REFERENCES public.sylius_promotion_coupon(id);


--
-- Name: sylius_order fk_6196a1f94d4cff2b; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order
    ADD CONSTRAINT fk_6196a1f94d4cff2b FOREIGN KEY (shipping_address_id) REFERENCES public.sylius_address(id);


--
-- Name: sylius_order fk_6196a1f972f5a1aa; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order
    ADD CONSTRAINT fk_6196a1f972f5a1aa FOREIGN KEY (channel_id) REFERENCES public.sylius_channel(id);


--
-- Name: sylius_order fk_6196a1f979d0c0e4; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order
    ADD CONSTRAINT fk_6196a1f979d0c0e4 FOREIGN KEY (billing_address_id) REFERENCES public.sylius_address(id);


--
-- Name: sylius_order fk_6196a1f99395c3f3; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order
    ADD CONSTRAINT fk_6196a1f99395c3f3 FOREIGN KEY (customer_id) REFERENCES public.sylius_customer(id);


--
-- Name: sylius_product fk_677b9b7414959723; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product
    ADD CONSTRAINT fk_677b9b7414959723 FOREIGN KEY (product_type_id) REFERENCES public.mollie_product_type(id) ON DELETE SET NULL;


--
-- Name: sylius_product fk_677b9b74731e505; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product
    ADD CONSTRAINT fk_677b9b74731e505 FOREIGN KEY (main_taxon_id) REFERENCES public.sylius_taxon(id) ON DELETE SET NULL;


--
-- Name: sylius_order_item fk_77b587ed3b69a9af; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order_item
    ADD CONSTRAINT fk_77b587ed3b69a9af FOREIGN KEY (variant_id) REFERENCES public.sylius_product_variant(id);


--
-- Name: sylius_order_item fk_77b587ed8d9f6d38; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order_item
    ADD CONSTRAINT fk_77b587ed8d9f6d38 FOREIGN KEY (order_id) REFERENCES public.sylius_order(id) ON DELETE CASCADE;


--
-- Name: sylius_channel_pricing fk_7801820ca80ef684; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_channel_pricing
    ADD CONSTRAINT fk_7801820ca80ef684 FOREIGN KEY (product_variant_id) REFERENCES public.sylius_product_variant(id) ON DELETE CASCADE;


--
-- Name: sylius_shop_user fk_7c2b74809395c3f3; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_shop_user
    ADD CONSTRAINT fk_7c2b74809395c3f3 FOREIGN KEY (customer_id) REFERENCES public.sylius_customer(id);


--
-- Name: sylius_customer fk_7e82d5e6bd94fb16; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_customer
    ADD CONSTRAINT fk_7e82d5e6bd94fb16 FOREIGN KEY (default_address_id) REFERENCES public.sylius_address(id) ON DELETE SET NULL;


--
-- Name: sylius_customer fk_7e82d5e6d2919a68; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_customer
    ADD CONSTRAINT fk_7e82d5e6d2919a68 FOREIGN KEY (customer_group_id) REFERENCES public.sylius_customer_group(id);


--
-- Name: sylius_order_item_unit fk_82bf226e7be036fc; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order_item_unit
    ADD CONSTRAINT fk_82bf226e7be036fc FOREIGN KEY (shipment_id) REFERENCES public.sylius_shipment(id) ON DELETE SET NULL;


--
-- Name: sylius_order_item_unit fk_82bf226ee415fb15; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_order_item_unit
    ADD CONSTRAINT fk_82bf226ee415fb15 FOREIGN KEY (order_item_id) REFERENCES public.sylius_order_item(id) ON DELETE CASCADE;


--
-- Name: sylius_product_image fk_88c64b2d7e3c61f9; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_image
    ADD CONSTRAINT fk_88c64b2d7e3c61f9 FOREIGN KEY (owner_id) REFERENCES public.sylius_product(id) ON DELETE CASCADE;


--
-- Name: sylius_product_variant fk_a29b5234584665a; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_variant
    ADD CONSTRAINT fk_a29b5234584665a FOREIGN KEY (product_id) REFERENCES public.sylius_product(id) ON DELETE CASCADE;


--
-- Name: sylius_product_variant fk_a29b5239df894ed; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_variant
    ADD CONSTRAINT fk_a29b5239df894ed FOREIGN KEY (tax_category_id) REFERENCES public.sylius_tax_category(id) ON DELETE SET NULL;


--
-- Name: sylius_product_variant fk_a29b5239e2d1a41; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_product_variant
    ADD CONSTRAINT fk_a29b5239e2d1a41 FOREIGN KEY (shipping_category_id) REFERENCES public.sylius_shipping_category(id) ON DELETE SET NULL;


--
-- Name: sylius_payment_method fk_a75b0b0df23d6140; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_payment_method
    ADD CONSTRAINT fk_a75b0b0df23d6140 FOREIGN KEY (gateway_config_id) REFERENCES public.sylius_gateway_config(id) ON DELETE SET NULL;


--
-- Name: sylius_address fk_b97ff0589395c3f3; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_address
    ADD CONSTRAINT fk_b97ff0589395c3f3 FOREIGN KEY (customer_id) REFERENCES public.sylius_customer(id) ON DELETE CASCADE;


--
-- Name: sylius_taxon fk_cfd811ca727aca70; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_taxon
    ADD CONSTRAINT fk_cfd811ca727aca70 FOREIGN KEY (parent_id) REFERENCES public.sylius_taxon(id) ON DELETE CASCADE;


--
-- Name: sylius_taxon fk_cfd811caa977936c; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_taxon
    ADD CONSTRAINT fk_cfd811caa977936c FOREIGN KEY (tree_root) REFERENCES public.sylius_taxon(id) ON DELETE CASCADE;


--
-- Name: sylius_payment fk_d9191bd419883967; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_payment
    ADD CONSTRAINT fk_d9191bd419883967 FOREIGN KEY (method_id) REFERENCES public.sylius_payment_method(id);


--
-- Name: sylius_payment fk_d9191bd48d9f6d38; Type: FK CONSTRAINT; Schema: public; Owner: sylius
--

ALTER TABLE ONLY public.sylius_payment
    ADD CONSTRAINT fk_d9191bd48d9f6d38 FOREIGN KEY (order_id) REFERENCES public.sylius_order(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 5ts4EedSPhXHhIX3yrANMgaBC9JKVMGSYMerSv0NlSkWVkLxfgViSISJarEbBTq

