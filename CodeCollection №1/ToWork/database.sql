create TABLE person(
    id SERIAL PRIMARY KEY,
    name VARCHAR(64)
);

create TABLE post(
    id SERIAL PRIMARY KEY,
    application VARCHAR(16),
    engineer int REFERENCES person (id),
    Discription VARCHAR(255),
    Time_start_req timestamp,
    Time_close_req timestamp,
    ATM VARCHAR(32)
);
create TABLE post_final(
    id SERIAL PRIMARY KEY,
    type_of_repair VARCHAR(128),
    engineer INTEGER REFERENCES person (id),
    time_spent integer --interval
);