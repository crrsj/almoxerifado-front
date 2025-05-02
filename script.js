document.addEventListener('DOMContentLoaded', function() {   
    // Variáveis globais
    let currentPage = 1;
    const itemsPerPage = 10;
    let allItems = [];

    // Elementos DOM
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const pagination = document.getElementById('pagination');
    const itemModal = new bootstrap.Modal(document.getElementById('itemModal'));

    // Variável global para controle do modal
const itemFormModal = new bootstrap.Modal(document.getElementById('itemFormModal'));

// Função para abrir o modal de formulário (novo item)
function openItemForm() {
    document.getElementById('formModalTitle').textContent = 'Adicionar Novo Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    itemFormModal.show();
}
window.openItemForm = openItemForm;
// Função para abrir o modal de edição
async function openEditForm(itemId) {
    try {
        const response = await fetch(`http://localhost:8080/api/itens/${itemId}`);
        const item = await response.json();
        
        document.getElementById('formModalTitle').textContent = 'Editar Item';   
        document.getElementById( 'itemId').value = item.itemId;
        document.getElementById('nome').value = item.nome;
        document.getElementById('categoria').value = item.categoria;
        document.getElementById('saldoAtual').value = item.saldoAtual;
        document.getElementById('quantidadeMinima').value = item.quantidadeMinima;
        document.getElementById('unidadeMedida').value = item.unidadeMedida;
        
        itemFormModal.show();
    } catch (error) {
        console.error('Erro ao carregar item:', error);
        alert('Não foi possível carregar os dados do item');
    }
}

// Expondo a função no escopo global
    window.openEditForm = openEditForm;
    // Fetch dos dados da API
    async function fetchItems() {
        try {
            const response = await fetch('http://localhost:8080/api/itens');
            if (!response.ok) throw new Error('Erro ao carregar dados');
            allItems = await response.json();
            renderTable();
        } catch (error) {
            console.error('Erro:', error);
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${error.message}</td></tr>`;
        }
    }

    // Renderiza a tabela com paginação
    function renderTable() {
        const filteredItems = filterItems();
        const paginatedItems = paginateItems(filteredItems);
        
        tableBody.innerHTML = paginatedItems.map( item => `
            <tr> 
               <td>${item.id}</td>
                <td>${item.codigo}</td>
                <td>${item.nome}</td>
                <td>${item.categoria}</td>
                <td>${item.saldoAtual}  ${item.unidadeMedida}</td>               
                <td>${item.quantidadeMinima}</td>
                <td>
                    <span class="badge badge-estoque ${item.saldoAtual <= item.quantidadeMinima ? 'badge-critico' : 'badge-normal'}">
                        ${item.saldoAtual <= item.quantidadeMinima ? 'Crítico' : 'Normal'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-action btn-outline-primary" onclick="showItemDetails(${item.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-action btn-outline-success" onclick="openEditForm(${item.id})" >
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-action btn-outline-danger" onclick="deletarRegistro(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        renderPagination(filteredItems.length);
    }

    // Filtra os itens
    function filterItems() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const status = statusFilter.value;

        return allItems.filter(item => {
            const matchesSearch = item.nome.toLowerCase().includes(searchTerm) || 
                                item.codigo.toLowerCase().includes(searchTerm);
            const matchesCategory = category ? item.categoria === category : true;
            const matchesStatus = status ? 
                (status === 'CRITICO' ? item.saldoAtual <= item.quantidadeMinima : item.saldoAtual > item.quantidadeMinima) : 
                true;
            
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }

    // Paginação
    function paginateItems(items) {
        const start = (currentPage - 1) * itemsPerPage;
        return items.slice(start, start + itemsPerPage);
    }

    // Renderiza a paginação
    function renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        let paginationHTML = '';

        if (totalPages > 1) {
            paginationHTML += `
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Anterior</a>
                </li>
            `;

            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                    </li>
                `;
            }

            paginationHTML += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Próxima</a>
                </li>
            `;
        }

        pagination.innerHTML = paginationHTML;
    }

    // Funções globais (acessíveis no HTML)
    window.changePage = function(page) {
        currentPage = page;
        renderTable();
    };

    window.showItemDetails = async function(id) {
        try {
            const response = await fetch(`http://localhost:8080/api/itens/${id}`);
            const item = await response.json();
            
            document.getElementById('modalBody').innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h5>${item.nome}</h5>
                        <p><strong>Id:</strong> ${item.id}</p>
                        <p><strong>Código:</strong> ${item.codigo}</p>
                        <p><strong>Categoria:</strong> ${item.categoria}</p>
                        <p><strong>Unidade:</strong> ${item.unidadeMedida}</p>
                    </div>
                    <div class="col-md-6">
                        <div class="alert ${item.saldoAtual <= item.quantidadeMinima ? 'alert-danger' : 'alert-success'}">
                            <strong>Estoque:</strong> ${item.saldoAtual} (Mínimo: ${item.quantidadeMinima})
                        </div>
                        <p><strong>Última Movimentação:</strong> 15/10/2023</p>
                    </div>
                </div>
                <hr>
                <h6>Histórico Recente</h6>
                <ul class="list-group">
                    <li class="list-group-item">20/10 - Entrada: 100 unidades</li>
                    <li class="list-group-item">18/10 - Saída: 50 unidades</li>
                </ul>
            `;
            
            itemModal.show();
        } catch (error) {
            console.error('Erro:', error);
        }
    };

    // Event Listeners
    searchButton.addEventListener('click', renderTable);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') renderTable();
    });
    categoryFilter.addEventListener('change', renderTable);
    statusFilter.addEventListener('change', renderTable);

    // Inicialização
    fetchItems();
});

function openItemModal(itemData = null) {
    // Obtém referências aos elementos do modal
    const modal = document.getElementById('itemFormModal');
    const modalTitle = document.getElementById('formModalTitle');
    const itemForm = document.getElementById('itemForm');
    const itemIdInput = document.getElementById('itemId');
    
    // Configura o modal baseado no tipo de operação
    if (itemData) {
        // Modo Edição
        modalTitle.textContent = 'Editar Item';
        itemIdInput.value = itemData.id;
        
        // Preenche os campos do formulário
        document.getElementById('codigo').value = itemData.codigo;
        document.getElementById('nome').value = itemData.nome;
        document.getElementById('categoria').value = itemData.categoria;
        document.getElementById('quantidade').value = itemData.saldoAtual;
        document.getElementById('minimo').value = itemData.quantidadeMinima;
        document.getElementById('unidade').value = itemData.unidadeMedida;
    } else {
        // Modo Cadastro
        modalTitle.textContent = 'Cadastrar Novo Item';
        itemIdInput.value = '';
        itemForm.reset(); // Limpa o formulário
    }
    
    // Exibe o modal usando Bootstrap 5
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    // Foca no primeiro campo
    setTimeout(() => {
        document.getElementById(itemData ? 'nome' : 'codigo').focus();
    }, 500);
}

document.getElementById('newItemBtn').addEventListener('click', () => {
    openItemModal(); // Abre o modal vazio para cadastro
});

function enviarFormulario() {
    // Obtém os valores dos campos do formulário
    var nome = document.getElementById("nome").value;
    var categoria = document.getElementById("categoria").value;
    var quantidadeMinima = document.getElementById("quantidadeMinima").value;
    var unidadeMedida = document.getElementById("unidadeMedida").value;
    var saldoAtual = document.getElementById("saldoAtual").value;
  
    
    // Constrói o objeto JSON com os valores dos campos do formulário
    var dadosFormulario = {
        nome: nome,
        categoria: categoria,
        quantidadeMinima: quantidadeMinima,
        unidadeMedida: unidadeMedida,
        saldoAtual: saldoAtual,
      
        
    };
    fetch("http://localhost:8080/api/itens", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosFormulario)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Dados enviados:", data);
        alert("dados cadastrados com sucesso !")        
        location.reload();

    })
    .catch(error => {
        console.error("Erro ao enviar os dados:", error);
        
    });
}
/*
async function updateUserData() {    
    const idInput =  document.getElementById("id");
    const nomeInput = document.getElementById("nome");   
    const categoriaInput = document.getElementById("caategoria");
    const quantidadeMinimaInput = document.getElementById("quantidadeMinima");
    const unidadeMedidaInput = document.getElementById("unidadeMedida");
    const saldoAtualInput = document.getElementById("saldoAtual");    
    
       
      
    const updateId =  idInput.value    
    const updateNome = nomeInput.value
    const updateCategoria = categoriaInput.value
    const updateQuantidadeMinima = quantidadeMinimaInput.value
    const updateUnidadeMedida = unidadeMedidaInput.value
    const updateSaldoAtual = saldoAtualInput.value 
   
   
  
    try {
      const response =  await fetch(`http://localhost:8080/api/itens/atualize/${id}` , {
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: updateId,
          nome: updateNome,         
          categoria:updateCategoria ,
          quantidadeMinima: updateQuantidadeMinima,
          unidadeMedida: updateUnidadeMedida,
          saldoAtual: updateSaldoAtual       
                   
          
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }
  
      alert('Dados do usuário atualizados com sucesso!');
      location.reload();
    } catch (error) {
      console.error(`Erro durante a atualização dos dados: ${error.message}`);
    }
    
    
  }
 */

  async function deletarRegistro(id) {
    try {
        
        const url = `http://localhost:8080/api/itens/${id}`;
  
        
        const confirmacao = confirm("Tem certeza que deseja excluir o funcionário?");
  
        
        if (confirmacao) {
            const options = {
                method: 'DELETE'
            };
  
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error('Erro ao deletar o registro');
            }
  
            alert('Registro deletado com sucesso');
            location.reload();

        } else {
            console.log('Exclusão cancelada pelo usuário');
            
        }
    } catch (error) {
        console.error('Erro:', error);
        
    }
    
  }

/*
  function showModal() {
    var myModal = document.getElementById('myModal');
    if (myModal) {
        var myInput = document.getElementById('myInput');
        if (myInput) {
            myModal.addEventListener('shown.bs.modal', function () {
                myInput.focus();
            });
            var modalInstance = new bootstrap.Modal(myModal);
            modalInstance.show();
        } else {
            console.error("Elemento 'myInput' não encontrado.");
        }
    } else {
        console.error("Elemento 'myModal' não encontrado.");
    }
}
  function buscarPorId(id) {
    fetch('http://localhost:8080/api/buscarEeditar' + id)
     .then(response => response.json())    
     .then(user => {
       preencherFormulario(user) ;
       showModal();
     
     })
     .catch(error => console.error('Error fetching user data:', error));
 }
 
   function preencherFormulario(user) {
   document.getElementById('id').value = user.id;
   document.getElementById('nome').value = user.nome;
   document.getElementById('categoria').value = user.categoria;
   document.getElementById('quantidadeMinima').value = user.quantidadeMinima;
   document.getElementById('unidadeMedida').value = user.unidadeMedida;
   document.getElementById('saldoAtual').value = user.SALDOaTUAL;
  
 }
*/

  fetchItems();