--
-- PostgreSQL database dump
--

\restrict GrxtQlK9iO9SKNUWu8KRlCCcMjIaJJ5PZm2SG9UWGnF6DOJkKQgoi7p049kNXdv

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    customer_name character varying(100) NOT NULL,
    customer_phone character varying(20),
    barber_id integer NOT NULL,
    service_id integer NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    actual_duration integer,
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    appointment_type character varying(20) DEFAULT 'booked'::character varying,
    CONSTRAINT appointments_status_check CHECK (((status)::text = ANY ((ARRAY['Booked'::character varying, 'Arrived'::character varying, 'InProgress'::character varying, 'Completed'::character varying, 'Cancelled'::character varying, 'NoShow'::character varying])::text[])))
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: bills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bills (
    id integer NOT NULL,
    appointment_id integer,
    total numeric(10,2) NOT NULL,
    paid boolean DEFAULT false,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paid_at timestamp without time zone,
    customer_name character varying(100),
    service_name character varying(100),
    barber_name character varying(100)
);


ALTER TABLE public.bills OWNER TO postgres;

--
-- Name: bills_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bills_id_seq OWNER TO postgres;

--
-- Name: bills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bills_id_seq OWNED BY public.bills.id;


--
-- Name: day_off_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.day_off_requests (
    id integer NOT NULL,
    barber_id integer,
    request_date date NOT NULL,
    status character varying(20) DEFAULT 'Pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT day_off_requests_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.day_off_requests OWNER TO postgres;

--
-- Name: day_off_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.day_off_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.day_off_requests_id_seq OWNER TO postgres;

--
-- Name: day_off_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.day_off_requests_id_seq OWNED BY public.day_off_requests.id;


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ratings (
    id integer NOT NULL,
    appointment_id integer,
    barber_id integer,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.ratings OWNER TO postgres;

--
-- Name: ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ratings_id_seq OWNER TO postgres;

--
-- Name: ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ratings_id_seq OWNED BY public.ratings.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    duration integer NOT NULL,
    image_url text,
    description text
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    role character varying(20) NOT NULL,
    password character varying(200) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    profile_picture character varying(255),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'barber'::character varying, 'receptionist'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: bills id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills ALTER COLUMN id SET DEFAULT nextval('public.bills_id_seq'::regclass);


--
-- Name: day_off_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_off_requests ALTER COLUMN id SET DEFAULT nextval('public.day_off_requests_id_seq'::regclass);


--
-- Name: ratings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings ALTER COLUMN id SET DEFAULT nextval('public.ratings_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, customer_name, customer_phone, barber_id, service_id, start_time, end_time, actual_duration, status, created_at, appointment_type) FROM stdin;
17	Sami	113156465	8	4	2026-07-21 16:29:49.569969	2026-07-21 16:30:00.920587	0	Completed	2026-07-21 16:28:53.823305	booked
18	Samson	\N	8	4	2026-07-21 16:49:42.459992	2026-07-21 16:49:44.067256	0	Completed	2026-07-21 16:49:12.738838	booked
19	Nahom	2545787	11	4	2026-07-23 15:51:46.836483	2026-07-23 15:52:01.29893	0	Completed	2026-07-23 15:10:37.327228	booked
20	Abebe Kebede	\N	8	4	2026-07-23 15:56:16.35395	2026-07-23 15:56:31.82209	0	Completed	2026-07-23 15:53:17.292033	booked
21	Abebe Kebede	\N	8	4	2026-07-23 16:10:24.444633	2026-07-23 16:10:28.776805	0	Completed	2026-07-23 16:09:59.678173	booked
22	Teferi	\N	10	4	2026-07-23 17:10:51.910766	2026-07-23 17:10:57.415078	0	Completed	2026-07-23 17:09:51.972637	booked
15	Kalkidan Melaku	0984325553	8	5	2026-07-21 15:26:22.642335	2026-07-21 15:26:29.809901	0	Completed	2026-07-21 15:25:19.030426	booked
16	Samuel	\N	11	4	2026-07-21 16:16:30.493536	2026-07-21 16:16:41.309045	0	Completed	2026-07-21 15:57:48.908305	booked
\.


--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bills (id, appointment_id, total, paid, generated_at, paid_at, customer_name, service_name, barber_name) FROM stdin;
28	15	11.50	t	2026-07-21 15:25:43.791821	2026-07-21 15:27:50.616044	Kalkidan Melaku	Beard Trim	Yared Abebe
29	15	11.50	t	2026-07-21 15:25:51.465644	2026-07-21 15:28:24.202948	Kalkidan Melaku	Beard Trim	Yared Abebe
30	17	23.00	t	2026-07-21 16:29:12.386692	2026-07-21 16:30:30.876048	Sami	Classic Haircut	Yared Abebe
31	19	23.00	t	2026-07-23 15:11:16.306782	2026-07-23 15:52:50.378489	Nahom	Classic Haircut	Yonas Hailu
32	21	20.00	t	2026-07-23 16:09:59.685175	2026-07-23 16:10:59.80921	Abebe Kebede	Classic Haircut	Yared Abebe
33	22	20.00	t	2026-07-23 17:09:51.9966	2026-07-23 17:11:20.441691	Teferi	Classic Haircut	Abel Kebede
\.


--
-- Data for Name: day_off_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.day_off_requests (id, barber_id, request_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ratings (id, appointment_id, barber_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, price, duration, image_url, description) FROM stdin;
4	Classic Haircut	20.00	60	/uploads/services/barber2.png	Experience timeless style with precision cuts that redefine confidence.
5	Beard Trim	10.00	20	/uploads/services/barber4.png	Sculpted perfection — a beard trim that sharpens your look with finesse.
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, role, password, created_at, profile_picture) FROM stdin;
1	Admin User	admin@barberbook.com	admin	$2a$06$7HqDdYdd5lZO4BwYPXa99OEl2SyKpbRdO2G36ZtrY52q.MzT9TEUO	2026-07-07 16:10:19.201126	\N
8	Yared Abebe	yared@barberbook.com	barber	$2b$10$KnjdDjueydDMsv0LjFfle.TWOst4McoW7NuyGqA7vi46XgNe.6Xsi	2026-07-17 15:42:40.310316	/uploads/1784292159991.png
9	Tigist Abebe	tigist@barberbook.com	receptionist	$2b$10$ZCLaC9DsfqI6h.PiRJ2mmuiB8liefhOjdWYi07IdHnrV3Perk1Xw.	2026-07-17 21:54:47.227527	/uploads/1784314486927.png
10	Abel Kebede	abel@barberbook.com	barber	$2b$10$WcShepCoBBASq3dzxaO6bux0FWPoFy6Ws82MaL.oFVL/CvpU63Kjy	2026-07-18 16:13:46.957422	/uploads/1784380426798.png
11	Yonas Hailu	yonas@barberbook.com	barber	$2b$10$igp58b6vucaqRkz/8vljNOXPxcHtHBJ3COojk7fXkVEFX7O2fmQvO	2026-07-18 16:14:37.501712	/uploads/1784380477351.png
\.


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_id_seq', 22, true);


--
-- Name: bills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bills_id_seq', 33, true);


--
-- Name: day_off_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.day_off_requests_id_seq', 1, false);


--
-- Name: ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ratings_id_seq', 1, false);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: bills bills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (id);


--
-- Name: day_off_requests day_off_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_off_requests
    ADD CONSTRAINT day_off_requests_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: appointments unique_barber_time; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT unique_barber_time UNIQUE (barber_id, start_time);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_barber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: bills bills_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: day_off_requests day_off_requests_barber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.day_off_requests
    ADD CONSTRAINT day_off_requests_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_barber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict GrxtQlK9iO9SKNUWu8KRlCCcMjIaJJ5PZm2SG9UWGnF6DOJkKQgoi7p049kNXdv

