#include <iostream>
#include <vector>
using namespace std;

int funcB(int matrix[5][5],int row, int column, int&b, int&c, int&d){
    int toggle1 = false;
    int toggle2 = false;

    for (size_t i = column + 1; i < 5; i++)
    {
        if(matrix[row][i] == b){toggle1 = i;}
    }
    for (size_t i = row + 1; i < 5; i++)
    {
        if(matrix[i][column] == c){toggle2 = i;}
    }
    if (toggle1 && toggle2)
    {
        if (matrix[toggle2][toggle1] == d)
        {
            return 1;
        }
        
    }
    
    return 0;
}

bool outRez(){
    cout << "Rectangle - true.\n";
    return 0;
}

int main() {
    int matrix[5][5] = {
    {7, 2, 9, 1, 5},
    {4, 8, 3, 6, 2},
    {1, 5, 7, 4, 8},
    {9, 3, 2, 5, 6},
    {2, 6, 4, 8, 3}
};
    // cout << "Enter matrix 5x5:\n";
    // for(int i=0;i<5;i++)
    //     for(int j=0;j<5;j++)
    //         cin >> matrix[i][j];

    int a, b, c, d;
    cout << "Enter 4 top of rec: ";
    cin >> a >> b >> c >> d;

    for (size_t i = 0; i < 5; i++){
        for (size_t j = 0; j < 5; j++){
            if (matrix[i][j] == a) {
                if(funcB(matrix, i, j, b, c, d)){return outRez();}
                if(funcB(matrix, i, j, b, d, c)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                if(funcB(matrix, i, j, c, d, b)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
            } 
            if (matrix[i][j] == b) {
                swap(a,b);
                if(funcB(matrix, i, j, b, c, d)){return outRez();}
                if(funcB(matrix, i, j, b, d, c)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                if(funcB(matrix, i, j, c, d, b)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                swap(a,b);
            } 
            if (matrix[i][j] == c) {
                swap(a,c);
                if(funcB(matrix, i, j, b, c, d)){return outRez();}
                if(funcB(matrix, i, j, b, d, c)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                if(funcB(matrix, i, j, c, d, b)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                swap(a,c);
            } if (matrix[i][j] == d) {
                swap(a,d);
                if(funcB(matrix, i, j, b, c, d)){return outRez();}
                if(funcB(matrix, i, j, b, d, c)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                if(funcB(matrix, i, j, c, d, b)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                if(funcB(matrix, i, j, c, b, d)){return outRez();}
                swap(a,d);
            } 
        }
    }
    cout << "Rectangle - false.\n";
    return 0;
}
