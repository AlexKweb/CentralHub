#include <iostream>
using namespace std;

// функция считает определитель 2x2-матрицы
double det(double m[2][2]) {
    return m[0][0]*m[1][1] - m[0][1]*m[1][0];
}

int main() {
    double a11, a12, a21, a22, b1, b2;
    cout << "Введите коэффициенты a11 a12 a21 a22 и правые части b1 b2: " << endl;
    // пример ввода: 2 3 1 -1 5 1  (означает: 2x+3y=5, 1x-1y=1)
    cin >> a11 >> a12 >> a21 >> a22 >> b1 >> b2;

    // матрица системы
    double A[2][2] = { {a11, a12}, {a21, a22} };

    // матрицы для Dx и Dy
    double Ax[2][2] = { {b1, a12}, {b2, a22} }; // первая колонка заменена на вектор правых частей
    double Ay[2][2] = { {a11, b1}, {a21, b2} }; // вторая колонка заменена

    double D  = det(A);
    double Dx = det(Ax);
    double Dy = det(Ay);

    const double EPS = 1e-9;
    if (fabs(D) > EPS) {
        double x = Dx / D;
        double y = Dy / D;
        cout << "Решение единственное:" << endl;
        cout << "x = " << x << endl;
        cout << "y = " << y << endl;
    } else {
        // D == 0
        if (fabs(Dx) < EPS && fabs(Dy) < EPS) {
            cout << "Бесконечно много решений (система зависима)." << endl;
        } else {
            cout << "Нет решений (система несовместна)." << endl;
        }
    }

    return 0;
}


