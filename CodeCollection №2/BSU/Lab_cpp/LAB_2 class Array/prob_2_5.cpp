#include "Array.h"

int main() {
    std::cout << "Введите размер квадратной матрицы: ";
    size_t n;
    std::cin >> n;

    Array<int> matrix(n * n);
    std::cout << "Введите " << n * n << " элементов: ";
    std::cin >> matrix;

    std::cout << "Элементы, минимальные в строке и максимальные в столбце:\n";
    for (size_t i = 0; i < n; ++i) {
        for (size_t j = 0; j < n; ++j) {
            int elem = matrix[i * n + j];
            bool minInRow = true;
            bool maxInCol = true;

            for (size_t k = 0; k < n; ++k) {
                if (matrix[i * n + k] < elem) {
                    minInRow = false;
                }
                if (matrix[k * n + j] > elem) {
                    maxInCol = false;
                }
            }

            if (minInRow && maxInCol) {
                std::cout << elem << " в позиции (" << i << "," << j << ")\n";
            }
        }
    }

    return 0;
}
