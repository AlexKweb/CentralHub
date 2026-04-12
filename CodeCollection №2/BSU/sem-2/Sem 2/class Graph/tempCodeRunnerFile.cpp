ways.resize(point+1);
    table.resize(point);
    for (size_t i = 0; i < edge; i++)
    {
        int u, v, w;
        in >> u >> v >> w;
        ways[u].push_back({v, w});
        table[u-1][v-1] = w;
    }