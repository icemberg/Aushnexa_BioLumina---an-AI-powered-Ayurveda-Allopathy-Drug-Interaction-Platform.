--
-- PostgreSQL database dump
--

\restrict V3ZXGsy0uxIZw1Q7bXbbBz6XBT4VdrOw4ieWtaAU4JhfVw84qhdkGpblmn2gy5F

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

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

ALTER TABLE ONLY public.users DROP CONSTRAINT users_institution_id_fkey;
ALTER TABLE ONLY public.query_history DROP CONSTRAINT query_history_user_id_fkey;
ALTER TABLE ONLY public.query_history DROP CONSTRAINT query_history_institution_id_fkey;
ALTER TABLE ONLY public.clinical_feedback DROP CONSTRAINT clinical_feedback_reviewer_id_fkey;
ALTER TABLE ONLY public.clinical_feedback DROP CONSTRAINT clinical_feedback_query_id_fkey;
DROP INDEX public.ix_users_email;
DROP INDEX public.ix_query_history_user_id;
DROP INDEX public.ix_query_history_institution_id;
DROP INDEX public.ix_institutions_domain;
DROP INDEX public.ix_clinical_feedback_query_id;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.query_history DROP CONSTRAINT query_history_pkey;
ALTER TABLE ONLY public.institutions DROP CONSTRAINT institutions_pkey;
ALTER TABLE ONLY public.clinical_feedback DROP CONSTRAINT clinical_feedback_pkey;
ALTER TABLE ONLY public.alembic_version DROP CONSTRAINT alembic_version_pkc;
DROP TABLE public.users;
DROP TABLE public.query_history;
DROP TABLE public.institutions;
DROP TABLE public.clinical_feedback;
DROP TABLE public.alembic_version;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: aushnexa_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO aushnexa_user;

--
-- Name: clinical_feedback; Type: TABLE; Schema: public; Owner: aushnexa_user
--

CREATE TABLE public.clinical_feedback (
    id uuid NOT NULL,
    query_id uuid NOT NULL,
    reviewer_id uuid,
    interaction_pair character varying(255),
    is_accurate boolean,
    severity_correction character varying(50),
    comments text,
    created_at timestamp without time zone
);


ALTER TABLE public.clinical_feedback OWNER TO aushnexa_user;

--
-- Name: institutions; Type: TABLE; Schema: public; Owner: aushnexa_user
--

CREATE TABLE public.institutions (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100),
    domain character varying(255),
    is_verified boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.institutions OWNER TO aushnexa_user;

--
-- Name: query_history; Type: TABLE; Schema: public; Owner: aushnexa_user
--

CREATE TABLE public.query_history (
    id uuid NOT NULL,
    user_id uuid,
    items json NOT NULL,
    items_checked character varying[],
    language character varying(10),
    patient_context json,
    request_json json,
    overall_risk character varying(50),
    risk_score double precision,
    overall_score double precision,
    interactions_found integer,
    response_json json,
    processing_time_ms integer,
    created_at timestamp without time zone,
    institution_id uuid,
    ip_address character varying(45),
    query_protocol character varying(255),
    risk_status character varying(50),
    anomaly_reason character varying(255)
);


ALTER TABLE public.query_history OWNER TO aushnexa_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: aushnexa_user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255),
    role character varying(50) NOT NULL,
    is_active boolean,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    institution_id uuid
);


ALTER TABLE public.users OWNER TO aushnexa_user;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: aushnexa_user
--

COPY public.alembic_version (version_num) FROM stdin;
6dc25d26cc7a
\.


--
-- Data for Name: clinical_feedback; Type: TABLE DATA; Schema: public; Owner: aushnexa_user
--

COPY public.clinical_feedback (id, query_id, reviewer_id, interaction_pair, is_accurate, severity_correction, comments, created_at) FROM stdin;
\.


--
-- Data for Name: institutions; Type: TABLE DATA; Schema: public; Owner: aushnexa_user
--

COPY public.institutions (id, name, type, domain, is_verified, created_at) FROM stdin;
\.


--
-- Data for Name: query_history; Type: TABLE DATA; Schema: public; Owner: aushnexa_user
--

COPY public.query_history (id, user_id, items, items_checked, language, patient_context, request_json, overall_risk, risk_score, overall_score, interactions_found, response_json, processing_time_ms, created_at, institution_id, ip_address, query_protocol, risk_status, anomaly_reason) FROM stdin;
7afb3dd0-33c7-449d-af2b-6a309c8c25a6	be1e1d9f-f8ec-486e-a472-44dfc0afa89b	["neem", "prilosec"]	{Neem,Omeprazole}	en	null	{"items": ["neem", "prilosec"], "language": "en", "patient_context": null}	low	\N	0	0	{"query_id": "ce198473-e73b-431c-86ed-88b6e30c97e9", "overall_risk": "low", "overall_score": 0.0, "interactions_found": 0, "interactions": [], "normalized_items": [{"original": "neem", "canonical": "Neem", "confidence": 1.0, "entity_type": "Herb"}, {"original": "prilosec", "canonical": "Omeprazole", "confidence": 1.0, "entity_type": "Drug"}], "explanation": "No documented interactions were found between Neem, Omeprazole. Always consult your healthcare provider.", "translated_explanation": null, "disclaimer": "Aushnexa provides information only and does not replace professional medical advice. Always consult your doctor or pharmacist before combining medications or herbal supplements.", "processing_time_ms": 43}	43	2026-05-21 17:59:29.172997	\N	\N	\N	\N	\N
b8ed0dfe-dd47-453d-ab41-3b5890777dbc	be1e1d9f-f8ec-486e-a472-44dfc0afa89b	["Ashwagandha", "Metformin"]	{Ashwagandha,Metformin}	en	null	{"items": ["Ashwagandha", "Metformin"], "language": "en", "patient_context": null}	low	\N	0	0	{"query_id": "74478fcd-7f92-47a7-898f-495615fc5989", "overall_risk": "low", "overall_score": 0.0, "interactions_found": 0, "interactions": [], "normalized_items": [{"original": "Ashwagandha", "canonical": "Ashwagandha", "confidence": 1.0, "entity_type": "Herb"}, {"original": "Metformin", "canonical": "Metformin", "confidence": 1.0, "entity_type": "Drug"}], "explanation": "No documented interactions were found between Ashwagandha, Metformin. Always consult your healthcare provider.", "translated_explanation": null, "disclaimer": "Aushnexa provides information only and does not replace professional medical advice. Always consult your doctor or pharmacist before combining medications or herbal supplements.", "processing_time_ms": 27}	27	2026-05-21 18:06:23.124956	\N	\N	\N	\N	\N
e7a52f6e-2fe8-457c-a6a4-c4c05ece244b	be1e1d9f-f8ec-486e-a472-44dfc0afa89b	["espino_blanco", "digoxina"]	{"Espino Blanco",digoxina}	en	null	{"items": ["espino_blanco", "digoxina"], "language": "en", "patient_context": null}	high	\N	0.6	1	{"query_id": "80c683c3-d78c-4c20-b195-25f23323c7c3", "overall_risk": "high", "overall_score": 0.6, "interactions_found": 1, "interactions": [{"item_a": "Espino Blanco", "item_b": "digoxina", "severity": "high", "severity_score": 0.6, "confidence": 0.28, "evidence_level": "0", "interaction_type": "Pharmacokinetic", "mechanism": "Los flavonoides del espino blanco tienen efecto inotr\\u00f3pico positivo similar al de la digoxina.", "compounds_involved": [], "recommendation": "Monitor patient and consider alternatives.", "evidence": [], "low_evidence_warning": true}], "normalized_items": [{"original": "espino_blanco", "canonical": "Espino Blanco", "confidence": 1.0, "entity_type": "herb"}, {"original": "digoxina", "canonical": "digoxina", "confidence": 1.0, "entity_type": "drug_class"}], "explanation": "The combination of Espino Blanco (Hawthorn) and digoxina (digoxin) may potentially increase the risk of adverse effects due to their similar effects on the heart. The flavonoids in Espino Blanco have a positive inotropic effect, which is similar to the mechanism of digoxina, and this could potentially lead to an additive effect on the heart. Based on the high severity of this interaction, it is recommended that you consult with your healthcare professional to discuss monitoring your condition and considering alternative treatments. Your healthcare professional can help you weigh the benefits and risks of this combination and make an informed decision about your care.", "translated_explanation": null, "disclaimer": "Aushnexa provides information only and does not replace professional medical advice. Always consult your doctor or pharmacist before combining medications or herbal supplements.", "processing_time_ms": 1303}	1303	2026-05-26 05:13:40.38943	\N	\N	\N	\N	\N
5caf33c3-8bd8-4df5-895a-f4c6a9fbe01b	be1e1d9f-f8ec-486e-a472-44dfc0afa89b	["te_verde", "tiroideos"]	{"Té verde (EGCG)",tiroideos}	en	null	{"items": ["te_verde", "tiroideos"], "language": "en", "patient_context": null}	moderate	\N	0.4	1	{"query_id": "90569e9b-92c9-42a3-ac87-7bda0ef9d146", "overall_risk": "moderate", "overall_score": 0.4, "interactions_found": 1, "interactions": [{"item_a": "T\\u00e9 verde (EGCG)", "item_b": "tiroideos", "severity": "moderate", "severity_score": 0.4, "confidence": 0.28, "evidence_level": "0", "interaction_type": "Pharmacokinetic", "mechanism": "Los taninos del t\\u00e9 verde quelan la levotiroxina en el intestino, reduciendo su absorci\\u00f3n.", "compounds_involved": [], "recommendation": "Monitor patient and consider alternatives.", "evidence": [], "low_evidence_warning": true}], "normalized_items": [{"original": "te_verde", "canonical": "T\\u00e9 verde (EGCG)", "confidence": 1.0, "entity_type": "herb"}, {"original": "tiroideos", "canonical": "tiroideos", "confidence": 1.0, "entity_type": "drug_class"}], "explanation": "The combination of T\\u00e9 verde (EGCG) and tiroideos may potentially reduce the absorption of tiroideos in your body. This could happen because the tannins in T\\u00e9 verde bind to the levotiroxina in your intestines, which may decrease the amount of tiroideos that your body can absorb. Based on moderate evidence, it's recommended that you monitor your condition and consider alternative options with the guidance of a healthcare professional. To ensure your safety and effectiveness of treatment, consult with your healthcare provider about the potential interaction between T\\u00e9 verde and tiroideos.", "translated_explanation": null, "disclaimer": "Aushnexa provides information only and does not replace professional medical advice. Always consult your doctor or pharmacist before combining medications or herbal supplements.", "processing_time_ms": 1692}	1692	2026-05-26 05:15:24.275224	\N	\N	\N	\N	\N
0086498e-e7a4-443c-ad43-bf1fb3f413d8	be1e1d9f-f8ec-486e-a472-44dfc0afa89b	["te_verde", "tiroideos"]	{"Té verde (EGCG)",tiroideos}	en	null	{"items": ["te_verde", "tiroideos"], "language": "en", "patient_context": null}	moderate	\N	0.4	1	{"query_id": "ba0b7d96-2100-414a-b36b-3edcce59d9c9", "overall_risk": "moderate", "overall_score": 0.4, "interactions_found": 1, "interactions": [{"item_a": "T\\u00e9 verde (EGCG)", "item_b": "tiroideos", "severity": "moderate", "severity_score": 0.4, "confidence": 0.28, "evidence_level": "0", "interaction_type": "Pharmacokinetic", "mechanism": "Los taninos del t\\u00e9 verde quelan la levotiroxina en el intestino, reduciendo su absorci\\u00f3n.", "compounds_involved": [], "recommendation": "Monitor patient and consider alternatives.", "evidence": [], "low_evidence_warning": true}], "normalized_items": [{"original": "te_verde", "canonical": "T\\u00e9 verde (EGCG)", "confidence": 1.0, "entity_type": "herb"}, {"original": "tiroideos", "canonical": "tiroideos", "confidence": 1.0, "entity_type": "drug_class"}], "explanation": "The combination of T\\u00e9 verde (EGCG) and tiroideos may potentially reduce the absorption of tiroideos in your body. This could happen because the tannins in T\\u00e9 verde bind to the levotiroxina in your intestines, which may decrease the amount of tiroideos that your body can absorb. Based on moderate evidence, it's recommended that you monitor your condition and consider alternative options with the guidance of a healthcare professional. To ensure your safety and effectiveness of treatment, consult with your healthcare provider about the potential interaction between T\\u00e9 verde and tiroideos.", "translated_explanation": null, "disclaimer": "Aushnexa provides information only and does not replace professional medical advice. Always consult your doctor or pharmacist before combining medications or herbal supplements.", "processing_time_ms": 46}	46	2026-05-26 11:51:01.144459	\N	\N	\N	\N	\N
9354317d-63b0-4778-9e4d-04fbdf049732	be1e1d9f-f8ec-486e-a472-44dfc0afa89b	["espino_blanco", "digoxina"]	{"Espino Blanco",digoxina}	en	null	{"items": ["espino_blanco", "digoxina"], "language": "en", "patient_context": null}	high	\N	0.6	1	{"query_id": "e9cb1525-e827-4e04-99eb-48484d7e617a", "overall_risk": "high", "overall_score": 0.6, "interactions_found": 1, "interactions": [{"item_a": "Espino Blanco", "item_b": "digoxina", "severity": "high", "severity_score": 0.6, "confidence": 0.28, "evidence_level": "0", "interaction_type": "Pharmacokinetic", "mechanism": "Los flavonoides del espino blanco tienen efecto inotr\\u00f3pico positivo similar al de la digoxina.", "compounds_involved": [], "recommendation": "Monitor patient and consider alternatives.", "evidence": [], "low_evidence_warning": true}], "normalized_items": [{"original": "espino_blanco", "canonical": "Espino Blanco", "confidence": 1.0, "entity_type": "herb"}, {"original": "digoxina", "canonical": "digoxina", "confidence": 1.0, "entity_type": "drug_class"}], "explanation": "The combination of Espino Blanco (Hawthorn) and digoxina (digoxin) may potentially increase the risk of adverse effects due to their similar effects on the heart. The flavonoids in Espino Blanco have a positive inotropic effect, which is similar to the effect of digoxina, and this could potentially lead to an additive effect on the heart. Based on the high severity of this interaction, it is recommended that you consult with your healthcare professional to monitor your condition and consider alternative treatments. Your healthcare professional can help you weigh the benefits and risks of this combination and make an informed decision about your care.", "translated_explanation": null, "disclaimer": "Aushnexa provides information only and does not replace professional medical advice. Always consult your doctor or pharmacist before combining medications or herbal supplements.", "processing_time_ms": 1301}	1301	2026-05-26 14:26:45.378561	\N	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: aushnexa_user
--

COPY public.users (id, email, password_hash, full_name, role, is_active, created_at, updated_at, institution_id) FROM stdin;
be1e1d9f-f8ec-486e-a472-44dfc0afa89b	1bi22cs003@bit-bangalore.edu.in	$2b$12$0d6TErel2kmUuymB30pT8eMPIhuHxy9XTQcTfwDZ/sugn1j2zn8Vm	Abhiraam S	PATIENT	t	2026-05-21 14:49:44.667042	2026-05-21 14:49:44.667042	\N
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: aushnexa_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: clinical_feedback clinical_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: aushnexa_user
--

ALTER TABLE ONLY public.clinical_feedback
    ADD CONSTRAINT clinical_feedback_pkey PRIMARY KEY (id);


--
-- Name: institutions institutions_pkey; Type: CONSTRAINT; Schema: public; Owner: aushnexa_user
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_pkey PRIMARY KEY (id);


--
-- Name: query_history query_history_pkey; Type: CONSTRAINT; Schema: public; Owner: aushnexa_user
--

ALTER TABLE ONLY public.query_history
    ADD CONSTRAINT query_history_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: aushnexa_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_clinical_feedback_query_id; Type: INDEX; Schema: public; Owner: aushnexa_user
--

CREATE INDEX ix_clinical_feedback_query_id ON public.clinical_feedback USING btree (query_id);


--
-- Name: ix_institutions_domain; Type: INDEX; Schema: public; Owner: aushnexa_user
--

CREATE INDEX ix_institutions_domain ON public.institutions USING btree (domain);


--
-- Name: ix_query_history_institution_id; Type: INDEX; Schema: public; Owner: aushnexa_user
--

CREATE INDEX ix_query_history_institution_id ON public.query_history USING btree (institution_id);


--
-- Name: ix_query_history_user_id; Type: INDEX; Schema: public; Owner: aushnexa_user
--

CREATE INDEX ix_query_history_user_id ON public.query_history USING btree (user_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: aushnexa_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: clinical_feedback clinical_feedback_query_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aushnexa_user
--

ALTER TABLE ONLY public.clinical_feedback
    ADD CONSTRAINT clinical_feedback_query_id_fkey FOREIGN KEY (query_id) REFERENCES public.query_history(id);


--
-- Name: clinical_feedback clinical_feedback_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aushnexa_user
--

ALTER TABLE ONLY public.clinical_feedback
    ADD CONSTRAINT clinical_feedback_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: query_history query_history_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aushnexa_user
--

ALTER TABLE ONLY public.query_history
    ADD CONSTRAINT query_history_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);


--
-- Name: query_history query_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aushnexa_user
--

ALTER TABLE ONLY public.query_history
    ADD CONSTRAINT query_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aushnexa_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id);


--
-- PostgreSQL database dump complete
--

\unrestrict V3ZXGsy0uxIZw1Q7bXbbBz6XBT4VdrOw4ieWtaAU4JhfVw84qhdkGpblmn2gy5F

